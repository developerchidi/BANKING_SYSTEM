import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import 'package:flutter/material.dart';
import 'auth_service.dart';
import 'token_storage.dart';

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
    final token = await TokenStorage.readAccessToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, String>> _buildHeaders(
    Map<String, String>? headers,
  ) async {
    final token = await TokenStorage.readAccessToken();
    if (kDebugMode) {
      debugPrint(
        'HTTP: auth header ${token != null ? "present" : "missing"}',
      );
    }

    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      ...?headers,
    };
  }

  Future<void> _handleTokenExpiration(BuildContext? context) async {
    await AuthService.logout();
    if (context != null) {
      await AuthService.showTokenExpirationModal(context);
    }
  }
}
