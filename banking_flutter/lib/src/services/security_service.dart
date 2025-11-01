import 'dart:convert';
import 'http_client.dart';

class SecurityService {
  final ApiClient _api;
  SecurityService(this._api);

  Future<Map<String, dynamic>> setPin(String pin) async {
    final res = await _api.post('/api/security/pin/set', body: {'pin': pin});
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) return data;
    throw Exception(data['message'] ?? 'Đặt PIN thất bại');
  }

  Future<Map<String, dynamic>> verifyPin(String pin) async {
    final res = await _api.post('/api/security/pin/verify', body: {'pin': pin});
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) return data;
    throw Exception(data['message'] ?? 'PIN không đúng');
  }

  Future<bool> hasPin() async {
    final res = await _api.get('/api/security/pin/exists');
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['success'] == true) {
      return (data['data']?['hasPin'] == true);
    }
    throw Exception(data['message'] ?? 'Không kiểm tra được trạng thái PIN');
  }
}
