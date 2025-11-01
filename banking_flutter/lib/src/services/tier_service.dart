import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'http_client.dart';

class TierService {
  // Request tier upgrade
  static Future<Map<String, dynamic>> requestTierUpgrade(
    String targetTier,
  ) async {
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl/api/tier/upgrade-request');
    final headers = await ApiClient.buildHeaders();

    final body = json.encode({'targetTier': targetTier});

    final res = await http.post(url, headers: headers, body: body);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json.decode(res.body);
    }

    throw Exception(
      'Request tier upgrade failed: ${res.statusCode} ${res.body}',
    );
  }

  // Get user's upgrade requests
  static Future<List<Map<String, dynamic>>> getMyUpgradeRequests() async {
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl/api/tier/my-requests');
    final headers = await ApiClient.buildHeaders();

    final res = await http.get(url, headers: headers);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = json.decode(res.body);
      if (data['success'] == true && data['data'] != null) {
        return List<Map<String, dynamic>>.from(data['data']['requests'] ?? []);
      }
    }

    throw Exception(
      'Get upgrade requests failed: ${res.statusCode} ${res.body}',
    );
  }

  // Get tier requirements
  static Future<Map<String, dynamic>> getTierRequirements() async {
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl/api/tier/requirements');
    final headers = await ApiClient.buildHeaders();

    final res = await http.get(url, headers: headers);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = json.decode(res.body);
      if (data['success'] == true && data['data'] != null) {
        return data['data']['requirements'];
      }
    }

    throw Exception(
      'Get tier requirements failed: ${res.statusCode} ${res.body}',
    );
  }
}

