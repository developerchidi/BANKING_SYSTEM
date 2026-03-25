import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'http_client.dart';
import 'token_expiration_service.dart';
import '../config/api_config.dart';

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
    final token = prefs.getString('accessToken');
    final user = prefs.getString('user');

    print('🔐 AuthService: Initializing authentication state');
    print('🔐 AuthService: Token found: ${token != null ? 'Yes' : 'No'}');
    print('🔐 AuthService: User found: ${user != null ? 'Yes' : 'No'}');

    isAuthenticated.value = token != null && token.isNotEmpty;
    currentUser.value = user;

    print(
      '🔐 AuthService: Initialized - isAuthenticated: ${isAuthenticated.value}',
    );
  }

  // Login method for AuthProvider
  Future<Map<String, dynamic>> login(String studentId, String password) async {
    print('🔐 AuthService: Attempting login for student ID: $studentId');

    final response = await _apiClient.post(
      '${ApiConfig.auth}/login',
      body: {'studentId': studentId, 'password': password},
    );

    print('🔐 AuthService: Login response status: ${response.statusCode}');
    print('🔐 AuthService: Login response body: ${response.body}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print('🔐 AuthService: Parsed response data: $data');
      print('🔐 AuthService: Response keys: ${data.keys.toList()}');
      print(
        '🔐 AuthService: AccessToken in response: ${data['accessToken'] != null ? 'Yes' : 'No'}',
      );
      print(
        '🔐 AuthService: RefreshToken in response: ${data['refreshToken'] != null ? 'Yes' : 'No'}',
      );

      // Check if 2FA is required
      if (data['requiresTwoFactor'] == true) {
        print('🔐 AuthService: 2FA required, storing temporary data');

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

      print('🔐 AuthService: Token received: ${token != null ? 'Yes' : 'No'}');
      print(
        '🔐 AuthService: Refresh token received: ${refreshToken != null ? 'Yes' : 'No'}',
      );
      print('🔐 AuthService: User received: ${user != null ? 'Yes' : 'No'}');

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

    print('🔐 AuthService: Completing 2FA with userId: $userId');

    if (tempToken == null || userId == null) {
      throw Exception('No temporary token or user ID found');
    }

    final response = await _apiClient.post(
      '${ApiConfig.auth}/2fa/complete-login',
      body: {'userId': userId, 'code': code},
    );

    print('🔐 AuthService: 2FA response status: ${response.statusCode}');
    print('🔐 AuthService: 2FA response body: ${response.body}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final tokens = data['tokens'];
      final user = data['user'];

      print(
        '🔐 AuthService: 2FA Token received: ${tokens != null ? 'Yes' : 'No'}',
      );
      print(
        '🔐 AuthService: 2FA User received: ${user != null ? 'Yes' : 'No'}',
      );

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
    print('🔐 AuthService: Saving tokens and user data');
    print('🔐 AuthService: Token length: ${token.length}');
    print('🔐 AuthService: User data: ${user.toString()}');

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', token);
    await prefs.setString('user', jsonEncode(user));

    print('🔐 AuthService: Tokens saved to SharedPreferences');

    // Verify token was saved
    final savedToken = prefs.getString('accessToken');
    print(
      '🔐 AuthService: Verification - token saved: ${savedToken != null ? 'Yes' : 'No'}',
    );
    print(
      '🔐 AuthService: Verification - saved token length: ${savedToken?.length ?? 0}',
    );

    isAuthenticated.value = true;
    currentUser.value = jsonEncode(user);

    print(
      '🔐 AuthService: AuthService state updated - isAuthenticated: ${isAuthenticated.value}',
    );
  }

  // Save tokens with refresh token
  Future<void> _saveTokensWithRefresh(
    String accessToken,
    String? refreshToken,
    dynamic user,
  ) async {
    print('🔐 AuthService: Saving tokens with refresh token');
    print('🔐 AuthService: Access token length: ${accessToken.length}');
    print(
      '🔐 AuthService: Refresh token available: ${refreshToken != null ? 'Yes' : 'No'}',
    );
    print('🔐 AuthService: User data: ${user.toString()}');

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await prefs.setString('refreshToken', refreshToken);
      print('🔐 AuthService: Refresh token saved');
    }
    await prefs.setString('user', jsonEncode(user));

    print('🔐 AuthService: All tokens saved to SharedPreferences');

    // Verify tokens were saved
    final savedAccessToken = prefs.getString('accessToken');
    final savedRefreshToken = prefs.getString('refreshToken');
    print(
      '🔐 AuthService: Verification - access token saved: ${savedAccessToken != null ? 'Yes' : 'No'}',
    );
    print(
      '🔐 AuthService: Verification - refresh token saved: ${savedRefreshToken != null ? 'Yes' : 'No'}',
    );
    print(
      '🔐 AuthService: Verification - access token length: ${savedAccessToken?.length ?? 0}',
    );
    print(
      '🔐 AuthService: Verification - refresh token length: ${savedRefreshToken?.length ?? 0}',
    );

    isAuthenticated.value = true;
    currentUser.value = jsonEncode(user);

    print(
      '🔐 AuthService: AuthService state updated - isAuthenticated: ${isAuthenticated.value}',
    );
  }

  // Static login method for direct use
  static Future<void> setLoginState(String token, String user) async {
    print('🔐 AuthService: setLoginState called');
    print('🔐 AuthService: Token length: ${token.length}');
    print('🔐 AuthService: User data: $user');

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', token);
    await prefs.setString('user', user);

    print('🔐 AuthService: Static tokens saved to SharedPreferences');

    isAuthenticated.value = true;
    currentUser.value = user;

    print(
      '🔐 AuthService: Static state updated - isAuthenticated: ${isAuthenticated.value}',
    );
  }

  // Logout
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');

    isAuthenticated.value = false;
    currentUser.value = null;
  }

  // Show token expiration modal
  static Future<void> showTokenExpirationModal(BuildContext context) async {
    print('🔐 AuthService: Showing token expiration modal');
    try {
      await TokenExpirationService.showAnimatedTokenExpirationModal(
        context: context,
        onLoginPressed: () {
          print('🔐 AuthService: Login button pressed in modal');
          // Navigate to login screen
          Navigator.of(
            context,
          ).pushNamedAndRemoveUntil('/login', (route) => false);
        },
      );
      print('🔐 AuthService: Token expiration modal shown successfully');
    } catch (e) {
      print('🔐 AuthService: Error showing token expiration modal: $e');
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
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    return token != null && token.isNotEmpty;
  }

  // Refresh token if needed
  Future<void> refreshTokenIfNeeded() async {
    print('🔐 AuthService: Checking if token refresh is needed');

    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString('refreshToken');

    if (refreshToken == null || refreshToken.isEmpty) {
      print('🔐 AuthService: No refresh token available');
      return;
    }

    try {
      print('🔐 AuthService: Attempting to refresh token');
      final response = await _apiClient.post(
        '${ApiConfig.auth}/refresh',
        body: {'refreshToken': refreshToken},
      );

      print('🔐 AuthService: Refresh response status: ${response.statusCode}');
      print('🔐 AuthService: Refresh response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newAccessToken = data['accessToken'];
        final newRefreshToken = data['refreshToken'];
        final user = data['user'];

        if (newAccessToken != null) {
          print('🔐 AuthService: Token refreshed successfully');
          await _saveTokensWithRefresh(newAccessToken, newRefreshToken, user);
        }
      } else {
        print('🔐 AuthService: Token refresh failed: ${response.statusCode}');
      }
    } catch (e) {
      print('🔐 AuthService: Token refresh error: $e');
    }
  }

  // Test token validity by making a simple API call
  Future<bool> testTokenValidity() async {
    print('🔐 AuthService: Testing token validity');

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');

    if (token == null || token.isEmpty) {
      print('🔐 AuthService: No token available for testing');
      return false;
    }

    try {
      // Make a simple API call to test token
      final response = await _apiClient.get('${ApiConfig.auth}/me');
      print(
        '🔐 AuthService: Token test response status: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        print('🔐 AuthService: Token is valid');
        return true;
      } else {
        print(
          '🔐 AuthService: Token is invalid - status: ${response.statusCode}',
        );
        return false;
      }
    } catch (e) {
      print('🔐 AuthService: Token test error: $e');
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
