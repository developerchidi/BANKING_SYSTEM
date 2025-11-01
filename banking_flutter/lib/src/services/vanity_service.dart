import 'dart:convert';
import 'http_client.dart';

class VanityService {
  final ApiClient _api;
  VanityService(this._api);

  String get _base => '/api/vanity';

  Future<Map<String, dynamic>> market({
    String? tier,
    int page = 1,
    int limit = 20,
  }) async {
    final q = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (tier != null && tier.isNotEmpty) 'tier': tier,
    };
    final path = '$_base/market' + _toQuery(q);
    final res = await _api.get(path);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) {
      return data['data'] as Map<String, dynamic>;
    }
    throw Exception(data['message'] ?? 'Failed to load market');
  }

  Future<Map<String, dynamic>> availability(String number) async {
    final res = await _api.get('$_base/availability/$number');
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) {
      return data['data'] as Map<String, dynamic>;
    }
    throw Exception(data['message'] ?? 'Failed to check availability');
  }

  Future<Map<String, dynamic>> price(String number) async {
    final path = '$_base/price' + _toQuery({'number': number});
    final res = await _api.get(path);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) {
      return data['data'] as Map<String, dynamic>;
    }
    throw Exception(data['message'] ?? 'Failed to get price');
  }

  Future<List<String>> suggest({String? pattern, int limit = 12}) async {
    final q = <String, String>{
      'limit': limit.toString(),
      if (pattern != null && pattern.isNotEmpty) 'pattern': pattern,
    };
    final path = '$_base/suggest' + _toQuery(q);
    final res = await _api.get(path);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) {
      final list = data['data'];
      if (list is List) return list.cast<String>();
    }
    throw Exception(data['message'] ?? 'Failed to suggest');
  }

  Future<Map<String, dynamic>> purchase({
    required String accountId,
    required String newAccountNumber,
  }) async {
    final res = await _api.post(
      '$_base/purchase',
      body: {'accountId': accountId, 'newAccountNumber': newAccountNumber},
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) {
      return data['data'] as Map<String, dynamic>;
    }
    throw Exception(data['message'] ?? 'Purchase failed');
  }

  String _toQuery(Map<String, String> q) {
    if (q.isEmpty) return '';
    final s = StringBuffer('?');
    bool first = true;
    q.forEach((k, v) {
      if (!first) s.write('&');
      first = false;
      s.write(Uri.encodeQueryComponent(k));
      s.write('=');
      s.write(Uri.encodeQueryComponent(v));
    });
    return s.toString();
  }
}
