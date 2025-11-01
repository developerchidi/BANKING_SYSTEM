import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../config/api_config.dart';
import 'package:flutter/material.dart';
import 'auth_service.dart';

class ApiClient {
  final http.Client _client;
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  Future<http.Response> post(
    String path, {
    Map<String, String>? headers,
    Object? body,
    BuildContext? context,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final mergedHeaders = await _buildHeaders(headers);

    // Convert body to JSON string if it's a Map
    String? bodyString;
    if (body != null) {
      if (body is Map) {
        bodyString = jsonEncode(body);
      } else if (body is String) {
        bodyString = body;
      } else {
        bodyString = body.toString();
      }
    }

    final response = await _client.post(
      uri,
      headers: mergedHeaders,
      body: bodyString,
    );

    // Check for token expiration
    if (response.statusCode == 401) {
      await _handleTokenExpiration(context);
    }

    return response;
  }

  Future<http.Response> get(
    String path, {
    Map<String, String>? headers,
    BuildContext? context,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final mergedHeaders = await _buildHeaders(headers);
    final response = await _client.get(uri, headers: mergedHeaders);

    // Check for token expiration
    if (response.statusCode == 401) {
      await _handleTokenExpiration(context);
    }

    return response;
  }

  Future<http.Response> put(
    String path, {
    Map<String, String>? headers,
    Object? body,
    BuildContext? context,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final mergedHeaders = await _buildHeaders(headers);

    // Convert body to JSON string if it's a Map
    String? bodyString;
    if (body != null) {
      if (body is Map) {
        bodyString = jsonEncode(body);
      } else if (body is String) {
        bodyString = body;
      } else {
        bodyString = body.toString();
      }
    }

    final response = await _client.put(
      uri,
      headers: mergedHeaders,
      body: bodyString,
    );

    // Check for token expiration
    if (response.statusCode == 401) {
      await _handleTokenExpiration(context);
    }

    return response;
  }

  Future<http.Response> delete(
    String path, {
    Map<String, String>? headers,
    BuildContext? context,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final mergedHeaders = await _buildHeaders(headers);
    final response = await _client.delete(uri, headers: mergedHeaders);

    // Check for token expiration
    if (response.statusCode == 401) {
      await _handleTokenExpiration(context);
    }

    return response;
  }

  static Future<Map<String, String>> buildHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, String>> _buildHeaders(
    Map<String, String>? headers,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');

    print(
      '🔐 HTTP Client: Building headers with token: ${token != null ? 'Present' : 'Missing'}',
    );
    if (token != null) {
      final previewLength = token.length > 20 ? 20 : token.length;
      print(
        '🔐 HTTP Client: Token preview: ${token.substring(0, previewLength)}...',
      );
    }

    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      ...?headers,
    };
  }

  Future<void> _handleTokenExpiration(BuildContext? context) async {
    print('🔐 HTTP Client: Handling token expiration');
    print('🔐 HTTP Client: Context available: ${context != null}');

    // Use AuthService to handle logout
    await AuthService.logout();
    print('🔐 Token expired - user logged out');

    // Show modal if context is available
    if (context != null) {
      print('🔐 HTTP Client: Showing token expiration modal');
      await AuthService.showTokenExpirationModal(context);
    } else {
      print('🔐 HTTP Client: No context available, cannot show modal');
    }
  }
}
