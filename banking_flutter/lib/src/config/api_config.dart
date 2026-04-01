import 'package:flutter/foundation.dart';

/// Cấu hình API — khớp mặc định với [banking_core_java] `server.port` (3001).
///
/// Build tùy chỉnh:
/// `flutter run --dart-define=API_HOST=192.168.1.10 --dart-define=API_PORT=3001`
/// Hoặc URL đầy đủ (staging/prod): `--dart-define=API_BASE_URL=https://api.example.com`
/// Flavor: `--dart-define=FLAVOR=dev|staging|prod` (ghi nhận trong debug log).
class ApiConfig {
  static const String _defaultHost = '127.0.0.1';
  static const int _defaultPort = 3001;

  static const String flavor = String.fromEnvironment(
    'FLAVOR',
    defaultValue: 'dev',
  );

  static String get serverIp =>
      const String.fromEnvironment('API_HOST', defaultValue: _defaultHost);

  static int get serverPort {
    const portStr = String.fromEnvironment(
      'API_PORT',
      defaultValue: '$_defaultPort',
    );
    final parsed = int.tryParse(portStr);
    return parsed ?? _defaultPort;
  }

  static String get baseUrl {
    const override = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (override.isNotEmpty) {
      return override.endsWith('/') ? override.substring(0, override.length - 1) : override;
    }
    return 'http://$serverIp:$serverPort';
  }

  static String get wsUrl {
    const override = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (override.isNotEmpty) {
      final raw = override.endsWith('/') ? override.substring(0, override.length - 1) : override;
      final u = Uri.parse(raw);
      final scheme = u.scheme == 'https' ? 'wss' : 'ws';
      final port = u.hasPort ? ':${u.port}' : '';
      return '$scheme://${u.host}$port/ws/notifications';
    }
    return 'ws://$serverIp:$serverPort/ws/notifications';
  }

  static const String apiPrefix = '/api';

  static const String auth = '$apiPrefix/auth';
  static const String twoFA = '$apiPrefix/2fa';
  static const String banking = '$apiPrefix/banking';
  static const String user = '$apiPrefix/user';
  static const String notifications = '$apiPrefix/notifications';

  static const String login = '$auth/login';
  static const String register = '$auth/register';
  static const String forgotPassword = '$auth/forgot-password';
  static const String verifyResetCode = '$auth/verify-reset-code';
  static const String resetPassword = '$auth/reset-password';
  static const String me = '$auth/me';

  /// Debug: in ra cấu hình khi cần (không log token).
  static void debugLogConfig() {
    if (kDebugMode) {
      debugPrint('[ApiConfig] flavor=$flavor baseUrl=$baseUrl');
    }
  }
}
