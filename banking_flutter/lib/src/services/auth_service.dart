import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'http_client.dart';
import 'token_expiration_service.dart';
import 'token_storage.dart';
import '../config/api_config.dart';

void _authDebug(String message) {
  if (kDebugMode) {
    debugPrint(message);
  }
}

class AuthService {
  final ApiClient _apiClient;

  AuthService(this._apiClient);

  static final ValueNotifier<bool> isAuthenticated = ValueNotifier<bool>(false);
  static final ValueNotifier<String?> currentUser = ValueNotifier<String?>(
    null,
  );

  // Initialize authentication state
  static Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    final token = await TokenStorage.readAccessToken();
    final user = prefs.getString('user');

    _authDebug('AuthService: init token=${token != null} user=${user != null}');
    await TokenStorage.debugLogPresence();

    isAuthenticated.value = token != null && token.isNotEmpty;
    currentUser.value = user;
  }

  // Login method for AuthProvider
  Future<Map<String, dynamic>> login(String studentId, String password) async {
    _authDebug('AuthService: login attempt');

    final response = await _apiClient.post(
      '${ApiConfig.auth}/login',
      body: {'studentId': studentId, 'password': password},
    );

    _authDebug('AuthService: login status ${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      // Check if 2FA is required
      if (data['requiresTwoFactor'] == true) {
        // Store temporary token and user ID for 2FA
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('temporaryToken', data['temporaryToken']);
        await prefs.setString('userId', data['user']['id']);

        // Return data with 2FA flag
        return data;
      }

      // If no 2FA required, proceed with normal login
      final token = data['accessToken'];
      final refreshToken = data['refreshToken'];
      final user = data['user'];

      if (token != null) {
        await _saveTokensWithRefresh(token, refreshToken, user);
        return data;
      }
    }

    throw Exception('Login failed: ${response.statusCode} - ${response.body}');
  }

  // Verify reset code (6 digits)
  Future<Map<String, dynamic>> verifyResetCode(String code) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.auth}/verify-reset-code',
        body: {'token': code},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200;
      return {
        'success': success,
        'message':
            data['message'] ??
            (success ? 'Mã xác nhận hợp lệ' : 'Mã không hợp lệ'),
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // Complete 2FA method for AuthProvider
  Future<Map<String, dynamic>> complete2FA(String userId, String code) async {
    final response = await _apiClient.post(
      '${ApiConfig.auth}/2fa/complete-login',
      body: {'userId': userId, 'code': code},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data['accessToken'];
      final user = data['user'];

      if (token != null) {
        await _saveTokens(token, user);
        return data;
      }
    }

    throw Exception('2FA verification failed');
  }

  // Send 2FA code method for AuthProvider
  Future<void> sendTwoFactorCode() async {
    // 2FA code is automatically sent during login
    // This method is kept for compatibility but doesn't need to make API call
    return;
  }

  // Complete two factor login method for AuthProvider
  Future<Map<String, dynamic>> completeTwoFactorLogin(String code) async {
    final prefs = await SharedPreferences.getInstance();
    final tempToken = prefs.getString('temporaryToken');
    final userId = prefs.getString('userId');

    _authDebug('AuthService: complete 2FA');

    if (tempToken == null || userId == null) {
      throw Exception('No temporary token or user ID found');
    }

    final response = await _apiClient.post(
      '${ApiConfig.auth}/2fa/complete-login',
      body: {'userId': userId, 'code': code},
    );

    _authDebug('AuthService: 2FA status ${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final tokens = data['tokens'];
      final user = data['user'];

      if (tokens != null && user != null) {
        await _saveTokensWithRefresh(
          tokens['accessToken'],
          tokens['refreshToken'],
          user,
        );

        // Clean up temporary data
        await prefs.remove('temporaryToken');
        await prefs.remove('userId');

        return data;
      }
    }

    throw Exception(
      '2FA verification failed: ${response.statusCode} - ${response.body}',
    );
  }

  // Save tokens and update state
  Future<void> _saveTokens(String token, dynamic user) async {
    await TokenStorage.writeTokens(accessToken: token, refreshToken: null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', jsonEncode(user));
    _authDebug('AuthService: tokens saved (secure)');
    isAuthenticated.value = true;
    currentUser.value = jsonEncode(user);
  }

  // Save tokens with refresh token
  Future<void> _saveTokensWithRefresh(
    String accessToken,
    String? refreshToken,
    dynamic user,
  ) async {
    await TokenStorage.writeTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', jsonEncode(user));
    _authDebug('AuthService: tokens+refresh saved (secure)');
    isAuthenticated.value = true;
    currentUser.value = jsonEncode(user);
  }

  // Static login method for direct use
  static Future<void> setLoginState(String token, String user) async {
    await TokenStorage.writeTokens(accessToken: token, refreshToken: null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', user);
    isAuthenticated.value = true;
    currentUser.value = user;
  }

  // Logout
  static Future<void> logout() async {
    await TokenStorage.clearTokens();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
    isAuthenticated.value = false;
    currentUser.value = null;
  }

  // Show token expiration modal
  static Future<void> showTokenExpirationModal(BuildContext context) async {
    _authDebug('AuthService: token expiration modal');
    try {
      await TokenExpirationService.showAnimatedTokenExpirationModal(
        context: context,
        onLoginPressed: () {
          Navigator.of(
            context,
          ).pushNamedAndRemoveUntil('/login', (route) => false);
        },
      );
    } catch (e) {
      _authDebug('AuthService: modal error $e');
      // Fallback: Navigate directly to login
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  // ===== Email Verification & Change Email =====
  Future<Map<String, dynamic>> verifyEmail(String token) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.auth}/verify-email',
        body: {'token': token},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200;
      return {
        'success': success,
        'message':
            data['message'] ??
            (success ? 'Xác thực email thành công' : 'Xác thực email thất bại'),
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> resendEmailVerification() async {
    try {
      final response = await _apiClient.post('${ApiConfig.auth}/resend-verification');
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200;
      return {
        'success': success,
        'message':
            data['message'] ??
            (success ? 'Đã gửi email xác thực' : 'Gửi email xác thực thất bại'),
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> changeEmail({
    required String newEmail,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.auth}/change-email',
        body: {'newEmail': newEmail, 'password': password},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200;
      return {
        'success': success,
        'message':
            data['message'] ??
            (success
                ? 'Đã cập nhật email. Vui lòng xác thực email mới.'
                : 'Đổi email thất bại'),
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<bool> isEmailAvailable(String email) async {
    try {
      final res = await _apiClient.get('${ApiConfig.auth}/check-email?email=$email');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return data['exists'] == false;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // Handle token expiration
  static Future<void> handleTokenExpiration(BuildContext context) async {
    await logout();

    // Show notification
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );

      // Navigate to login screen
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  // Check if user is authenticated
  static Future<bool> checkAuth() async {
    final token = await TokenStorage.readAccessToken();
    return token != null && token.isNotEmpty;
  }

  // Refresh token if needed
  Future<void> refreshTokenIfNeeded() async {
    final refreshToken = await TokenStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return;
    }
    try {
      final response = await _apiClient.post(
        '${ApiConfig.auth}/refresh',
        body: {'refreshToken': refreshToken},
      );
      _authDebug('AuthService: refresh status ${response.statusCode}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newAccessToken = data['accessToken'];
        final newRefreshToken = data['refreshToken'];
        final user = data['user'];
        if (newAccessToken != null) {
          await _saveTokensWithRefresh(newAccessToken, newRefreshToken, user);
        }
      }
    } catch (e) {
      _authDebug('AuthService: refresh error $e');
    }
  }

  // Test token validity by making a simple API call
  Future<bool> testTokenValidity() async {
    final token = await TokenStorage.readAccessToken();
    if (token == null || token.isEmpty) {
      return false;
    }
    try {
      final response = await _apiClient.get('${ApiConfig.auth}/me');
      _authDebug('AuthService: /me status ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      _authDebug('AuthService: token test error $e');
      return false;
    }
  }

  // Get user profile
  Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final response = await _apiClient.get('${ApiConfig.auth}/me');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return {'success': true, 'data': data['data']};
      }
      return {'success': false, 'message': 'Failed to get user profile'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // Change password
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.auth}/change-password',
        body: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200 && (data['success'] == true)) {
        return {
          'success': true,
          'message': data['message'] ?? 'Đổi mật khẩu thành công',
        };
      }
      return {
        'success': false,
        'message': data['message'] ?? 'Đổi mật khẩu thất bại',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // Enable Two-Factor Authentication (requires password confirmation)
  Future<Map<String, dynamic>> enableTwoFactor(String password) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.twoFA}/enable',
        body: {'password': password},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200 && (data['success'] == true);
      return {
        'success': success,
        'message':
            data['message'] ??
            (success ? 'Bật 2FA thành công' : 'Bật 2FA thất bại'),
        'data': data['data'],
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // Disable Two-Factor Authentication (requires password confirmation)
  Future<Map<String, dynamic>> disableTwoFactor(String password) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.twoFA}/disable',
        body: {'password': password},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200 && (data['success'] == true);
      return {
        'success': success,
        'message':
            data['message'] ??
            (success ? 'Tắt 2FA thành công' : 'Tắt 2FA thất bại'),
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // Forgot password: request reset email
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.auth}/forgot-password',
        body: {'email': email},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200;
      return {
        'success': success,
        'message':
            data['message'] ??
            (success
                ? 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.'
                : 'Yêu cầu quên mật khẩu thất bại'),
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // Reset password with token
  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.auth}/reset-password',
        body: {'token': token, 'newPassword': newPassword},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final success = response.statusCode == 200;
      return {
        'success': success,
        'message':
            data['message'] ??
            (success
                ? 'Đặt lại mật khẩu thành công'
                : 'Đặt lại mật khẩu thất bại'),
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // Duplicate methods removed above to fix redefinition errors
}
