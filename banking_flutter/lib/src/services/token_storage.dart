import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Access/refresh token: ưu tiên secure storage; đọc fallback từ SharedPreferences (migration).
class TokenStorage {
  TokenStorage._();

  static const _accessKey = 'accessToken';
  static const _refreshKey = 'refreshToken';

  static const FlutterSecureStorage _secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static Future<String?> readAccessToken() async {
    final s = await _secure.read(key: _accessKey);
    if (s != null && s.isNotEmpty) {
      return s;
    }
    final prefs = await SharedPreferences.getInstance();
    final legacy = prefs.getString(_accessKey);
    if (legacy != null && legacy.isNotEmpty) {
      await _secure.write(key: _accessKey, value: legacy);
      await prefs.remove(_accessKey);
    }
    return legacy;
  }

  static Future<String?> readRefreshToken() async {
    final s = await _secure.read(key: _refreshKey);
    if (s != null && s.isNotEmpty) {
      return s;
    }
    final prefs = await SharedPreferences.getInstance();
    final legacy = prefs.getString(_refreshKey);
    if (legacy != null && legacy.isNotEmpty) {
      await _secure.write(key: _refreshKey, value: legacy);
      await prefs.remove(_refreshKey);
    }
    return legacy;
  }

  static Future<void> writeTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _secure.write(key: _accessKey, value: accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await _secure.write(key: _refreshKey, value: refreshToken);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
  }

  static Future<void> clearTokens() async {
    await _secure.delete(key: _accessKey);
    await _secure.delete(key: _refreshKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
  }

  static Future<void> debugLogPresence() async {
    if (!kDebugMode) {
      return;
    }
    final a = await readAccessToken();
    final r = await readRefreshToken();
    debugPrint('[TokenStorage] access=${a != null ? "set" : "none"} refresh=${r != null ? "set" : "none"}');
  }
}
