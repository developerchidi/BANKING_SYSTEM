// banking_flutter/lib/src/services/notification_api_service.dart
import 'dart:convert';
import 'http_client.dart';
import '../config/api_config.dart';

class NotificationApiService {
  final ApiClient _apiClient;

  NotificationApiService(this._apiClient);

  // Lấy danh sách thông báo
  Future<Map<String, dynamic>> getNotifications({
    String? type,
    String? priority,
    String? category,
    bool? isRead,
    int? limit,
    int? offset,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (type != null) queryParams['type'] = type;
      if (priority != null) queryParams['priority'] = priority;
      if (category != null) queryParams['category'] = category;
      if (isRead != null) queryParams['isRead'] = isRead.toString();
      if (limit != null) queryParams['limit'] = limit.toString();
      if (offset != null) queryParams['offset'] = offset.toString();

      final queryString = queryParams.isEmpty
          ? ''
          : '?${queryParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';

      final response = await _apiClient.get('${ApiConfig.notifications}$queryString');
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['success'] == true) {
        return data['data'] as Map<String, dynamic>;
      } else {
        throw Exception(data['error'] ?? 'Không thể lấy danh sách thông báo');
      }
    } catch (e) {
      print('Error getting notifications: $e');
      rethrow;
    }
  }

  // Lấy chi tiết thông báo
  Future<Map<String, dynamic>> getNotificationById(String id) async {
    try {
      final response = await _apiClient.get('${ApiConfig.notifications}/$id');
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['success'] == true) {
        return data['data'] as Map<String, dynamic>;
      } else {
        throw Exception(data['error'] ?? 'Không thể lấy chi tiết thông báo');
      }
    } catch (e) {
      print('Error getting notification detail: $e');
      rethrow;
    }
  }

  // Đánh dấu thông báo đã đọc
  Future<void> markAsRead(String id) async {
    try {
      final response = await _apiClient.put(
        '${ApiConfig.notifications}/$id/read',
        body: {},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode != 200 || data['success'] != true) {
        throw Exception(data['error'] ?? 'Không thể đánh dấu đã đọc');
      }
    } catch (e) {
      print('Error marking notification as read: $e');
      rethrow;
    }
  }

  // Đánh dấu tất cả thông báo đã đọc
  Future<Map<String, dynamic>> markAllAsRead() async {
    try {
      final response = await _apiClient.put(
        '${ApiConfig.notifications}/read-all',
        body: {},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['success'] == true) {
        return data['data'] as Map<String, dynamic>;
      } else {
        throw Exception(data['error'] ?? 'Không thể đánh dấu tất cả đã đọc');
      }
    } catch (e) {
      print('Error marking all notifications as read: $e');
      rethrow;
    }
  }

  // Xóa thông báo
  Future<void> deleteNotification(String id) async {
    try {
      final response = await _apiClient.delete('${ApiConfig.notifications}/$id');
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode != 200 || data['success'] != true) {
        throw Exception(data['error'] ?? 'Không thể xóa thông báo');
      }
    } catch (e) {
      print('Error deleting notification: $e');
      rethrow;
    }
  }

  // Lấy số thông báo chưa đọc
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.get('${ApiConfig.notifications}/unread-count');
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['success'] == true) {
        final countData = data['data'] as Map<String, dynamic>;
        return countData['count'] as int? ?? 0;
      } else {
        throw Exception(data['error'] ?? 'Không thể đếm số thông báo chưa đọc');
      }
    } catch (e) {
      print('Error getting unread count: $e');
      return 0; // Return 0 on error to prevent UI issues
    }
  }

  // Tạo thông báo (chỉ dành cho admin/manager/teller/customer_service)
  Future<List<Map<String, dynamic>>> createNotification({
    required String title,
    required String content,
    required List<String> receiverIds,
    String? type,
    String? priority,
    String? category,
    String? relatedType,
    String? relatedId,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConfig.notifications,
        body: {
          'title': title,
          'content': content,
          'receiverIds': receiverIds,
          if (type != null) 'type': type,
          if (priority != null) 'priority': priority,
          if (category != null) 'category': category,
          if (relatedType != null) 'relatedType': relatedType,
          if (relatedId != null) 'relatedId': relatedId,
        },
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['success'] == true) {
        return (data['data'] as List).cast<Map<String, dynamic>>();
      } else {
        throw Exception(data['error'] ?? 'Không thể tạo thông báo');
      }
    } catch (e) {
      print('Error creating notification: $e');
      rethrow;
    }
  }
}
