import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'http_client.dart';
import '../models/account.dart';
import '../models/transaction.dart';
import '../models/beneficiary.dart';
import '../models/card.dart' as model;

class BankingService {
  final ApiClient _api;
  BankingService(this._api);

  Future<List<Account>> getAccounts({BuildContext? context}) async {
    print('🌐 Banking: Calling getAccounts...');
    final res = await _api.get(
      "${ApiConfig.banking}/accounts",
      context: context,
    );
    print('🌐 Banking: getAccounts response ${res.statusCode}: ${res.body}');
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      // Support both flat list and wrapped shape: { data: { accounts: [] } }
      dynamic list;
      if (data is List) {
        list = data;
      } else if (data is Map &&
          data['data'] is Map &&
          (data['data']['accounts'] is List)) {
        list = data['data']['accounts'];
      } else if (data is Map && data['accounts'] is List) {
        list = data['accounts'];
      } else {
        throw Exception('Unexpected accounts response shape');
      }
      return (list as List)
          .map((e) => Account.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Failed to load accounts: ${res.body}');
  }

  Future<Map<String, dynamic>> getDashboardSummary() async {
    final res = await _api.get("${ApiConfig.banking}/dashboard/summary");
    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to load summary: ${res.body}');
  }

  Future<List<BankTransaction>> getTransactions({
    String? accountId,
    int limit = 10,
    int offset = 0,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final query = <String, String>{
      'limit': '$limit',
      'offset': '$offset',
      if (accountId != null) 'accountId': accountId,
      if (startDate != null) 'startDate': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate.toIso8601String(),
    };
    final uri = Uri.parse(
      "${ApiConfig.baseUrl}${ApiConfig.banking}/transactions",
    ).replace(queryParameters: query);

    final res = await http.get(uri, headers: await ApiClient.buildHeaders());
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      // Support shapes:
      // 1) [ ... ]
      // 2) { data: { items: [] } }
      // 3) { data: [] }
      // 4) { items: [] }
      dynamic list;
      if (data is List) {
        list = data;
      } else if (data is Map &&
          data['data'] is Map &&
          (data['data']['items'] is List)) {
        list = data['data']['items'];
      } else if (data is Map && (data['data'] is List)) {
        list = data['data'];
      } else if (data is Map && data['items'] is List) {
        list = data['items'];
      } else if (data is Map &&
          data['data'] is Map &&
          (data['data']['transactions'] is List)) {
        list = data['data']['transactions'];
      } else {
        throw Exception('Unexpected transactions response shape');
      }
      return (list as List)
          .map((e) {
            try {
              return BankTransaction.fromJson(e as Map<String, dynamic>);
            } catch (error) {
              print('🌐 Banking: Error parsing transaction: $error');
              print('🌐 Banking: Transaction data: $e');
              return null;
            }
          })
          .where((transaction) => transaction != null)
          .cast<BankTransaction>()
          .toList();
    }
    throw Exception('Failed to load transactions: ${res.body}');
  }

  Future<List<Beneficiary>> getBeneficiaries() async {
    final res = await _api.get("${ApiConfig.banking}/beneficiaries");
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      dynamic list;
      if (data is List) {
        list = data;
      } else if (data is Map &&
          data['data'] is Map &&
          (data['data']['beneficiaries'] is List)) {
        list = data['data']['beneficiaries'];
      } else if (data is Map && data['beneficiaries'] is List) {
        list = data['beneficiaries'];
      } else {
        throw Exception('Unexpected beneficiaries response shape');
      }
      return (list as List)
          .map((e) => Beneficiary.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Failed to load beneficiaries: ${res.body}');
  }

  Future<List<model.BankCard>> getCards() async {
    final res = await _api.get("${ApiConfig.banking}/cards");
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      dynamic list;
      if (data is List) {
        list = data;
      } else if (data is Map &&
          data['data'] is Map &&
          (data['data']['cards'] is List)) {
        list = data['data']['cards'];
      } else if (data is Map && data['cards'] is List) {
        list = data['cards'];
      } else {
        throw Exception('Unexpected cards response shape');
      }
      return (list as List)
          .map((e) => model.BankCard.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Failed to load cards: ${res.body}');
  }

  Future<Map<String, dynamic>> verifyAccount(String accountNumber) async {
    print('🌐 Banking: Calling verifyAccount...');
    final res = await _api.get(
      "${ApiConfig.banking}/verify-account/$accountNumber",
    );
    print('🌐 Banking: verifyAccount response ${res.statusCode}: ${res.body}');

    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    } else if (res.statusCode == 404) {
      throw Exception('Không tìm thấy tài khoản');
    }
    throw Exception('Lỗi xác thực tài khoản: ${res.body}');
  }

  Future<Map<String, dynamic>> transfer({
    required String fromAccountId,
    required String toAccountNumber,
    required String toAccountName,
    required double amount,
    String? note,
  }) async {
    print('🌐 Banking: Calling transfer...');

    // For external transfers, we need toAccountNumber (not toAccountId)
    final body = {
      'fromAccountId': fromAccountId,
      'toAccountNumber': toAccountNumber, // Required for external transfers
      'amount': amount,
      'transferType': 'external', // External transfer by account number
      if (note != null && note.isNotEmpty) 'description': note,
    };

    final res = await _api.post("${ApiConfig.banking}/transfer", body: body);
    print('🌐 Banking: transfer response ${res.statusCode}: ${res.body}');

    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Transfer failed: ${res.body}');
  }

  Future<Map<String, dynamic>> verifyTransferOtp({
    required String transactionId,
    required String otpCode,
  }) async {
    print('🌐 Banking: Calling verifyTransferOtp...');
    final body = {'transactionId': transactionId, 'otpCode': otpCode};

    final res = await _api.post(
      "${ApiConfig.banking}/transfer/verify-otp",
      body: body,
    );
    print(
      '🌐 Banking: verifyTransferOtp response ${res.statusCode}: ${res.body}',
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('OTP verification failed: ${res.body}');
  }

  Future<Map<String, dynamic>> resendTransferOtp({
    required String transactionId,
  }) async {
    print('🌐 Banking: Calling resendTransferOtp...');
    final body = {'transactionId': transactionId};

    final res = await _api.post(
      "${ApiConfig.banking}/transfer/resend-otp",
      body: body,
    );
    print(
      '🌐 Banking: resendTransferOtp response ${res.statusCode}: ${res.body}',
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Resend OTP failed: ${res.body}');
  }
}
