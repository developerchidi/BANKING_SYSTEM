import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiBaseResolver {
  // Không thay đổi ApiConfig; chỉ hiệu chỉnh ở runtime nếu cần
  static String resolve(String baseUrl) {
    if (kIsWeb) return baseUrl; // web dùng baseUrl như cấu hình
    // Nếu chạy Android emulator và baseUrl đang trỏ localhost thì map sang 10.0.2.2
    if (Platform.isAndroid && baseUrl.contains('localhost')) {
      return baseUrl.replaceFirst('localhost', '10.0.2.2');
    }
    return baseUrl;
  }
}


