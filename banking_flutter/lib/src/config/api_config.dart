class ApiConfig {
  // ===== CẤU HÌNH SERVER IP =====
  // Thay đổi IP này khi IP máy tính thay đổi
  static const String serverIp = '192.168.1.11';
  static const int serverPort = 3001;
  // ===============================

  // Base URL tự động từ serverIp
  static String get baseUrl => 'http://$serverIp:$serverPort';

  // WebSocket URL
  static String get wsUrl => 'ws://$serverIp:$serverPort/ws/notifications';

  // API endpoints
  static const String auth = '/api/auth';
  static const String twoFA = '/api/2fa';
  static const String banking = '/api/banking';
  static const String user = '/api/user';
}
