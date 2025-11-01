import 'dart:convert';
import '../services/http_client.dart';

class InterestService {
  final ApiClient _apiClient;

  InterestService(this._apiClient);

  /// Lấy lịch sử lãi suất của user
  Future<Map<String, dynamic>> getInterestHistory({
    int limit = 50,
    int page = 1,
  }) async {
    try {
      final response = await _apiClient.get(
        '/api/interest/history?limit=$limit&page=$page',
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'data': data['data'],
          'pagination': data['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': 'Không thể lấy lịch sử lãi suất',
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      print('❌ Error getting interest history: $e');
      return {
        'success': false,
        'message': 'Không thể lấy lịch sử lãi suất',
        'error': e.toString(),
      };
    }
  }

  /// Lấy tổng lãi suất năm của user
  Future<Map<String, dynamic>> getYearlyInterest({int? year}) async {
    try {
      final url = year != null
          ? '/api/interest/yearly?year=$year'
          : '/api/interest/yearly';
      final response = await _apiClient.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        return {
          'success': false,
          'message': 'Không thể lấy tổng lãi suất năm',
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      print('❌ Error getting yearly interest: $e');
      return {
        'success': false,
        'message': 'Không thể lấy tổng lãi suất năm',
        'error': e.toString(),
      };
    }
  }

  /// Lấy lãi suất hiện tại cho loại tài khoản
  Future<Map<String, dynamic>> getCurrentRates({
    required String accountType,
    String tier = 'STANDARD',
  }) async {
    try {
      final response = await _apiClient.get(
        '/api/interest/rates?accountType=$accountType&tier=$tier',
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        return {
          'success': false,
          'message': 'Không thể lấy lãi suất hiện tại',
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      print('❌ Error getting current rates: $e');
      return {
        'success': false,
        'message': 'Không thể lấy lãi suất hiện tại',
        'error': e.toString(),
      };
    }
  }

  /// Tính lãi suất cho một tài khoản cụ thể (Admin only)
  Future<Map<String, dynamic>> calculateAccountInterest(
    String accountId,
  ) async {
    try {
      final response = await _apiClient.get(
        '/api/interest/calculate/$accountId',
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        return {
          'success': false,
          'message': 'Không thể tính lãi suất cho tài khoản',
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      print('❌ Error calculating account interest: $e');
      return {
        'success': false,
        'message': 'Không thể tính lãi suất cho tài khoản',
        'error': e.toString(),
      };
    }
  }

  /// Tính lãi suất cho tất cả tài khoản (Admin only)
  Future<Map<String, dynamic>> calculateAllInterest() async {
    try {
      final response = await _apiClient.get('/api/interest/calculate-all');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        return {
          'success': false,
          'message': 'Không thể tính lãi suất cho tất cả tài khoản',
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      print('❌ Error calculating all interest: $e');
      return {
        'success': false,
        'message': 'Không thể tính lãi suất cho tất cả tài khoản',
        'error': e.toString(),
      };
    }
  }

  /// Post lãi suất cho một tài khoản (Admin only)
  Future<Map<String, dynamic>> postAccountInterest(String accountId) async {
    try {
      final response = await _apiClient.post('/api/interest/post/$accountId');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': data['message'],
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'message': 'Không thể cộng lãi suất vào tài khoản',
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      print('❌ Error posting account interest: $e');
      return {
        'success': false,
        'message': 'Không thể cộng lãi suất vào tài khoản',
        'error': e.toString(),
      };
    }
  }

  /// Khởi tạo lãi suất mặc định (Admin only)
  Future<Map<String, dynamic>> initializeRates() async {
    try {
      final response = await _apiClient.post('/api/interest/initialize-rates');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'message': data['message']};
      } else {
        return {
          'success': false,
          'message': 'Không thể khởi tạo lãi suất mặc định',
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      print('❌ Error initializing rates: $e');
      return {
        'success': false,
        'message': 'Không thể khởi tạo lãi suất mặc định',
        'error': e.toString(),
      };
    }
  }
}
