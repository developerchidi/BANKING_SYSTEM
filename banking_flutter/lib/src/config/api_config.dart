class ApiConfig {
  // ===== CẤU HÌNH SERVER IP =====
  // Thay đổi IP này khi IP máy tính thay đổi
  static const String serverIp = '127.0.0.1';
  static const int serverPort = 3002;
  // ===============================

  // Base URL tự động từ serverIp
  static String get baseUrl => 'http://$serverIp:$serverPort';

  // WebSocket URL
  static String get wsUrl => 'ws://$serverIp:$serverPort/ws/notifications';

  // API Prefix
  static const String apiPrefix = '/api/v1';

  // API endpoints
  static const String auth = '$apiPrefix/auth';
  static const String twoFA = '$apiPrefix/2fa';
  static const String banking = '$apiPrefix/banking';
  static const String user = '$apiPrefix/user';
  static const String notifications = '$apiPrefix/notifications';

  // Specific Auth Endpoints
  static const String login = '$auth/login';
  static const String register = '$auth/register';
  static const String forgotPassword = '$auth/forgot-password';
  static const String verifyResetCode = '$auth/verify-reset-code';
  static const String resetPassword = '$auth/reset-password';
  static const String me = '$auth/me';
}
