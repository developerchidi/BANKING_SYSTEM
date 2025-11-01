import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService authService;
  AuthProvider(this.authService);

  bool _loading = false;
  bool get loading => _loading;
  String? _error;
  String? get error => _error;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? get user => _user;
  String? _accessToken;
  String? get accessToken => _accessToken;
  bool _requiresTwoFactor = false;
  bool get requiresTwoFactor => _requiresTwoFactor;
  String? _twoFactorUserId;
  String? get twoFactorUserId => _twoFactorUserId;

  Future<void> login(String studentId, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await authService.login(studentId, password);
      if ((result['requiresTwoFactor'] ?? false) == true) {
        _requiresTwoFactor = true;
        _twoFactorUserId = (result['user'] != null)
            ? result['user']['id'] as String?
            : null;
        // Store user data for 2FA screen (including email)
        if (result['user'] != null) {
          _user = Map<String, dynamic>.from(result['user'] as Map);
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('user', jsonEncode(result['user']));
            final temp = result['temporaryToken'] as String?;
            if (temp != null && temp.isNotEmpty) {
              await prefs.setString('temporaryToken', temp);
            }
            final uid = result['user'] != null
                ? result['user']['id'] as String?
                : null;
            if (uid != null && uid.isNotEmpty) {
              await prefs.setString('userId', uid);
            }
          } catch (_) {}
        }
      } else {
        _accessToken = result['accessToken'];
        await _persistTokensAndUser(result);
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> verifyTwoFactor(String code) async {
    if (_twoFactorUserId == null) return;
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await authService.complete2FA(_twoFactorUserId!, code);
      await _persistTokensAndUser({
        'user': result['user'],
        'tokens': result['tokens'],
      });
      _requiresTwoFactor = false;
      _twoFactorUserId = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> sendTwoFactorCode() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await authService.sendTwoFactorCode();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> completeTwoFactorLogin(String code) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await authService.completeTwoFactorLogin(code);
      // Fix: Get accessToken from tokens object
      final tokens = result['tokens'];
      _accessToken = tokens?['accessToken'];
      await _persistTokensAndUser(result);
      _requiresTwoFactor = false;
      _twoFactorUserId = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> refreshUserData() async {
    try {
      final result = await authService.getUserProfile();
      if (result['success'] == true && result['data'] != null) {
        _user = Map<String, dynamic>.from(result['data'] as Map);
        // Update SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user', jsonEncode(result['data']));
        notifyListeners();
      }
    } catch (e) {
      print('Failed to refresh user data: $e');
    }
  }

  Future<void> _persistTokensAndUser(Map<String, dynamic> result) async {
    final prefs = await SharedPreferences.getInstance();
    // Accept both nested tokens { tokens: { accessToken, refreshToken } } and flat { accessToken, refreshToken }
    final tokens = (result['tokens'] is Map)
        ? result['tokens'] as Map
        : result as Map;
    final access = tokens['accessToken'] as String?;
    final refresh = tokens['refreshToken'] as String?;
    if (access != null && access.isNotEmpty) {
      await prefs.setString('accessToken', access);
    }
    if (refresh != null && refresh.isNotEmpty) {
      await prefs.setString('refreshToken', refresh);
    }
    final user = result['user'];
    if (user != null) {
      await prefs.setString('user', jsonEncode(user));
      _user = Map<String, dynamic>.from(user as Map);

      // Connect to WebSocket notifications
      final userId = _user?['id'] as String?;
      if (userId != null && access != null) {
        print('🔌 Connecting to WebSocket for user: $userId');
        await NotificationService().updateUserCredentials(userId, access);
        print('✅ WebSocket connection initiated');
      } else {
        print('❌ Cannot connect WebSocket - missing userId or accessToken');
        print('   UserId: $userId');
        print('   AccessToken: ${access?.substring(0, 20)}...');
      }
    }
    notifyListeners();
  }
}
