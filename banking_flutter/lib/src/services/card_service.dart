import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'http_client.dart';

class CardDto {
  final String id;
  final String masked;
  final String? fullNumber;
  final String brand;
  final String holder;
  final bool isActive;
  final bool isBlocked;
  final int? dailyLimit;
  final int? monthlyLimit;
  final int? atmDailyLimit;

  CardDto({
    required this.id,
    required this.masked,
    required this.fullNumber,
    required this.brand,
    required this.holder,
    required this.isActive,
    required this.isBlocked,
    this.dailyLimit,
    this.monthlyLimit,
    this.atmDailyLimit,
  });

  factory CardDto.fromJson(Map<String, dynamic> json) {
    final rawNumber = json['cardNumber'];
    final cardNumber = rawNumber == null ? '' : rawNumber.toString();
    final masked = cardNumber.isNotEmpty
        ? '**** **** **** ${cardNumber.substring(cardNumber.length - 4)}'
        : '**** **** **** ****';
    final holder = (json['cardholderName'] ?? '').toString();
    return CardDto(
      id: (json['id'] ?? json['cardId'] ?? '').toString(),
      masked: masked,
      fullNumber: rawNumber == null ? null : cardNumber,
      brand: (json['cardBrand'] ?? 'VISA').toString(),
      holder: holder,
      isActive: (json['isActive'] as bool?) ?? false,
      isBlocked: (json['isBlocked'] as bool?) ?? false,
      dailyLimit: json['dailyLimit'] != null
          ? int.tryParse(json['dailyLimit'].toString())
          : null,
      monthlyLimit: json['monthlyLimit'] != null
          ? int.tryParse(json['monthlyLimit'].toString())
          : null,
      atmDailyLimit: json['atmDailyLimit'] != null
          ? int.tryParse(json['atmDailyLimit'].toString())
          : null,
    );
  }
}

class CardService {
  static Future<List<CardDto>> fetchMyCards() async {
    final baseUrl = ApiConfig.baseUrl; // e.g. http://10.0.2.2:3001
    final url = Uri.parse('$baseUrl${ApiConfig.banking}/cards');
    final headers = await ApiClient.buildHeaders();
    final res = await http.get(url, headers: headers);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = json.decode(res.body);
      List<dynamic> list;
      if (data is List) {
        list = data;
      } else if (data is Map && data['data'] is List) {
        list = data['data'] as List<dynamic>;
      } else if (data is Map &&
          data['data'] is Map &&
          (data['data']['cards'] is List)) {
        list = data['data']['cards'] as List<dynamic>;
      } else if (data is Map && data['cards'] is List) {
        list = data['cards'] as List<dynamic>;
      } else {
        list = const [];
      }
      return list
          .whereType<Map<String, dynamic>>()
          .map((e) => CardDto.fromJson(e))
          .toList();
    }
    throw Exception('Fetch cards failed: ${res.statusCode} ${res.body}');
  }

  static Future<CardDto> issueCard({
    required String accountId,
    required String cardType,
    required String pin,
  }) async {
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl${ApiConfig.banking}/cards');
    final headers = await ApiClient.buildHeaders();
    final body = json.encode({
      'accountId': accountId,
      'cardType': cardType,
      'pin': pin,
    });
    final res = await http.post(url, headers: headers, body: body);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = json.decode(res.body);
      Map<String, dynamic>? cardJson;
      if (data is Map && data['data'] is Map && (data['data']['card'] is Map)) {
        cardJson = (data['data']['card'] as Map).cast<String, dynamic>();
      } else if (data is Map && data['card'] is Map) {
        cardJson = (data['card'] as Map).cast<String, dynamic>();
      }
      if (cardJson != null) {
        return CardDto.fromJson(cardJson);
      }
      throw Exception('Unexpected issue card response');
    }
    throw Exception('Issue card failed: ${res.statusCode} ${res.body}');
  }

  static Future<CardDto> setCardBlock({
    required String cardId,
    required bool block,
    String? reason,
  }) async {
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl${ApiConfig.banking}/cards/$cardId/block');
    final headers = await ApiClient.buildHeaders();
    final res = await http.post(
      url,
      headers: headers,
      body: json.encode({'block': block, if (reason != null) 'reason': reason}),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = json.decode(res.body);
      final cardJson = data is Map && data['data'] is Map
          ? (data['data']['card'] as Map<String, dynamic>)
          : (data['card'] as Map<String, dynamic>);
      return CardDto.fromJson(cardJson);
    }
    throw Exception('Update card status failed: ${res.statusCode} ${res.body}');
  }

  static Future<CardDto> updateLimits({
    required String cardId,
    double? dailyLimit,
    double? monthlyLimit,
    double? atmDailyLimit,
  }) async {
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl${ApiConfig.banking}/cards/$cardId/limits');
    final headers = await ApiClient.buildHeaders();
    final res = await http.put(
      url,
      headers: headers,
      body: json.encode({
        if (dailyLimit != null) 'dailyLimit': dailyLimit,
        if (monthlyLimit != null) 'monthlyLimit': monthlyLimit,
        if (atmDailyLimit != null) 'atmDailyLimit': atmDailyLimit,
      }),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = json.decode(res.body);
      final cardJson = data is Map && data['data'] is Map
          ? (data['data']['card'] as Map<String, dynamic>)
          : (data['card'] as Map<String, dynamic>);
      return CardDto.fromJson(cardJson);
    }
    throw Exception('Update card limits failed: ${res.statusCode} ${res.body}');
  }

  static Future<CardDto> createVirtual({
    required String accountId,
    required String pin,
  }) async {
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl${ApiConfig.banking}/cards/virtual');
    final headers = await ApiClient.buildHeaders();
    final res = await http.post(
      url,
      headers: headers,
      body: json.encode({'accountId': accountId, 'pin': pin}),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = json.decode(res.body);
      final cardJson = data is Map && data['data'] is Map
          ? (data['data']['card'] as Map<String, dynamic>)
          : (data['card'] as Map<String, dynamic>);
      return CardDto.fromJson(cardJson);
    }
    throw Exception(
      'Create virtual card failed: ${res.statusCode} ${res.body}',
    );
  }
}
