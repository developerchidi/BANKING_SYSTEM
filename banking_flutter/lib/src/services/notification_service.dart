import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'token_storage.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  String? _userId;
  String? _accessToken;

  // Stream for notifying new notifications
  final _notificationStreamController = StreamController<void>.broadcast();
  Stream<void> get notificationStream => _notificationStreamController.stream;

  // Notification types
  static const String TRANSACTION_RECEIVED = 'transaction_received';
  static const String ADMIN_DEPOSIT = 'admin_deposit';
  static const String BALANCE_UPDATE = 'balance_update';
  static const String INTEREST_ADDED = 'interest_added';
  static const String NEW_NOTIFICATION = 'NEW_NOTIFICATION';

  Future<void> initialize() async {
    // Request notification permission
    await _requestNotificationPermission();

    // Create professional notification channels
    await _createNotificationChannels();

    // Initialize local notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
          requestAlertPermission: true,
          requestBadgePermission: true,
          requestSoundPermission: true,
        );

    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsIOS,
        );

    await _notifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Load user credentials
    await _loadUserCredentials();
  }

  Future<void> _createNotificationChannels() async {
    // Transaction Channel
    const AndroidNotificationChannel transactionChannel =
        AndroidNotificationChannel(
          'banking_transactions',
          'Giao Dịch Chidi Bank',
          description: 'Thông báo về các giao dịch tài khoản',
          importance: Importance.high,
          playSound: true,
          enableVibration: true,
          enableLights: true,
          showBadge: true,
        );

    // Security Channel
    const AndroidNotificationChannel securityChannel =
        AndroidNotificationChannel(
          'banking_security',
          'Bảo Mật Chidi Bank',
          description: 'Thông báo bảo mật và xác thực',
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
          enableLights: true,
          showBadge: true,
        );

    // System Channel
    const AndroidNotificationChannel systemChannel = AndroidNotificationChannel(
      'banking_system',
      'Hệ Thống Chidi Bank',
      description: 'Thông báo từ hệ thống ngân hàng',
      importance: Importance.defaultImportance,
      playSound: false,
      enableVibration: false,
      enableLights: false,
      showBadge: true,
    );

    // Create channels
    await _notifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(transactionChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(securityChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(systemChannel);
  }

  Future<void> _requestNotificationPermission() async {
    if (await Permission.notification.isDenied) {
      await Permission.notification.request();
    }
  }

  Future<void> _loadUserCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    _userId = prefs.getString('userId');
    if (_userId == null || _userId!.isEmpty) {
      final userJson = prefs.getString('user');
      if (userJson != null) {
        try {
          final m = jsonDecode(userJson) as Map<String, dynamic>;
          _userId = m['id'] as String?;
        } catch (_) {}
      }
    }
    _accessToken = await TokenStorage.readAccessToken();
  }

  Future<void> connectToWebSocket() async {
    if (_userId == null || _accessToken == null) {
      if (kDebugMode) {
        debugPrint('WebSocket: missing credentials userId=${_userId != null} token=${_accessToken != null}');
      }
      return;
    }

    // Check if already connected
    if (_channel != null && _subscription != null) {
      if (kDebugMode) {
        debugPrint('WebSocket: already connected');
      }
      return;
    }

    try {
      final wsUrl = '${ApiConfig.wsUrl}?userId=$_userId&token=$_accessToken';
      if (kDebugMode) {
        debugPrint('WebSocket: connecting to ${ApiConfig.wsUrl} (token hidden)');
      }

      // Disconnect any existing connection first
      await disconnect();

      // Connect to WebSocket with authentication
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      _subscription = _channel!.stream.listen(
        _handleWebSocketMessage,
        onError: _handleWebSocketError,
        onDone: _handleWebSocketDisconnected,
      );

      print('✅ Connected to WebSocket for user: $_userId');
    } catch (e) {
      print('❌ Failed to connect to WebSocket: $e');
    }
  }

  void _handleWebSocketMessage(dynamic message) {
    try {
      print('📨 Received WebSocket message: $message');
      final data = jsonDecode(message);
      final type = data['type'] as String?;
      final payload = data['payload'] as Map<String, dynamic>?;

      print('📋 Message type: $type');
      print('📋 Message payload: $payload');

      if (payload == null) {
        print('⚠️ Payload is null, ignoring message');
        return;
      }

      switch (type) {
        case TRANSACTION_RECEIVED:
          print('💰 Processing transaction notification');
          _showTransactionNotification(payload);
          break;
        case ADMIN_DEPOSIT:
          print('🏦 Processing admin deposit notification');
          _showAdminDepositNotification(payload);
          break;
        case BALANCE_UPDATE:
          print('💳 Processing balance update notification');
          _showBalanceUpdateNotification(payload);
          break;
        case INTEREST_ADDED:
          print('💰 Processing interest added notification');
          _showInterestAddedNotification(payload);
          break;
        case NEW_NOTIFICATION:
          print('🔔 Processing new notification');
          _showNewNotification(payload);
          break;
        default:
          print('❓ Unknown notification type: $type');
      }
    } catch (e) {
      print('❌ Error handling WebSocket message: $e');
    }
  }

  void _handleWebSocketError(error) {
    print('❌ WebSocket error: $error');
    print('   Error type: ${error.runtimeType}');
    print('   Error details: $error');

    // Attempt to reconnect after 5 seconds
    Timer(const Duration(seconds: 5), () {
      if (_userId != null && _accessToken != null) {
        print('🔄 Attempting to reconnect after error...');
        connectToWebSocket();
      } else {
        print('❌ Cannot reconnect: Missing credentials');
      }
    });
  }

  void _handleWebSocketDisconnected() {
    print('🔌 WebSocket disconnected');
    print('   UserId: $_userId');
    print('   Has AccessToken: ${_accessToken != null}');

    _subscription?.cancel();
    _subscription = null;
    _channel = null;

    // Attempt to reconnect after 3 seconds
    Timer(const Duration(seconds: 3), () {
      if (_userId != null && _accessToken != null) {
        print('🔄 Attempting to reconnect after disconnection...');
        connectToWebSocket();
      } else {
        print('❌ Cannot reconnect: Missing credentials');
      }
    });
  }

  Future<void> _showTransactionNotification(
    Map<String, dynamic> payload,
  ) async {
    // Safe type casting with fallbacks
    final amount = (payload['amount'] is int)
        ? (payload['amount'] as int).toDouble()
        : (payload['amount'] as double? ?? 0.0);
    final description = payload['description'] as String? ?? 'Giao dịch mới';
    final transactionType = payload['type'] as String? ?? 'TRANSFER';

    final isCredit =
        transactionType == 'TRANSFER' || transactionType == 'CREDIT';
    final sign = isCredit ? '+' : '-';
    final formattedAmount = _formatCurrencyVND(amount);
    final color = isCredit ? Colors.green : Colors.red;

    await _showNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: 'Thông báo biến động số dư',
      body: '$sign$formattedAmount VND | $description',
      payload: jsonEncode(payload),
      color: color,
    );
  }

  Future<void> _showAdminDepositNotification(
    Map<String, dynamic> payload,
  ) async {
    print('🏦 Showing professional admin deposit notification');

    // Safe type casting with fallbacks
    final amount = (payload['amount'] is int)
        ? (payload['amount'] as int).toDouble()
        : (payload['amount'] as double? ?? 0.0);
    final adminName = payload['adminName'] as String? ?? 'Hệ Thống';
    final description =
        payload['description'] as String? ?? 'Nạp tiền từ hệ thống';
    final accountNumber = payload['accountNumber'] as String? ?? '';
    final transactionNumber = payload['transactionNumber'] as String? ?? '';
    final newBalance = (payload['newBalance'] is int)
        ? (payload['newBalance'] as int).toDouble()
        : (payload['newBalance'] as double? ?? 0.0);

    print('💰 Amount: $amount (type: ${amount.runtimeType})');
    print('👤 Admin: $adminName');
    print('📝 Description: $description');
    print('🏦 Account: $accountNumber');
    print('🔢 Transaction: $transactionNumber');
    print('💳 New Balance: $newBalance');

    // Professional notification content - Banking style
    final title = 'Thông báo biến động số dư';
    final body = _formatProfessionalDepositBody(
      amount: amount,
      adminName: adminName,
      description: description,
      accountNumber: accountNumber,
      transactionNumber: transactionNumber,
      newBalance: newBalance,
    );

    await _showProfessionalNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      payload: jsonEncode(payload),
      channelId: 'banking_transactions',
      channelName: 'Giao Dịch Ngân Hàng',
      color: Colors.green,
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: BigTextStyleInformation(
        body,
        htmlFormatBigText: true,
        contentTitle: title,
        htmlFormatContentTitle: true,
      ),
    );

    print('✅ Professional admin deposit notification sent');
  }

  String _formatProfessionalDepositBody({
    required double amount,
    required String adminName,
    required String description,
    required String accountNumber,
    required String transactionNumber,
    required double newBalance,
  }) {
    final formattedAmount = _formatCurrencyVND(amount);
    final formattedBalance = _formatCurrencyVND(newBalance);
    final timestamp = DateTime.now().toString().substring(
      11,
      19,
    ); // HH:MM:SS only

    return '''+$formattedAmount VND | $description | TK: $accountNumber | SD: $formattedBalance VND | $timestamp''';
  }

  String _formatCurrencyVND(double amount) {
    // Convert to integer to avoid decimal issues
    final intAmount = amount.toInt();

    // Format with proper thousand separators for Vietnamese currency
    if (intAmount >= 1000000000) {
      // Billions: 1.000.000.000+
      final billions = intAmount ~/ 1000000000;
      final remainder = intAmount % 1000000000;

      if (remainder == 0) {
        return '${billions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.000.000.000';
      } else {
        final millions = remainder ~/ 1000000;
        final thousands = (remainder % 1000000) ~/ 1000;
        final units = remainder % 1000;

        String result =
            '${billions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.';

        if (millions > 0) {
          result += '${millions.toString().padLeft(3, '0')}.';
        } else {
          result += '000.';
        }

        if (thousands > 0) {
          result += '${thousands.toString().padLeft(3, '0')}.';
        } else {
          result += '000.';
        }

        if (units > 0) {
          result += units.toString().padLeft(3, '0');
        } else {
          result += '000';
        }

        return result;
      }
    } else if (intAmount >= 1000000) {
      // Millions: 1.000.000+
      final millions = intAmount ~/ 1000000;
      final remainder = intAmount % 1000000;

      if (remainder == 0) {
        return '${millions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.000.000';
      } else {
        final thousands = remainder ~/ 1000;
        final units = remainder % 1000;

        String result =
            '${millions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.';

        if (thousands > 0) {
          result += '${thousands.toString().padLeft(3, '0')}.';
        } else {
          result += '000.';
        }

        if (units > 0) {
          result += units.toString().padLeft(3, '0');
        } else {
          result += '000';
        }

        return result;
      }
    } else if (intAmount >= 1000) {
      // Thousands: 1.000+
      final thousands = intAmount ~/ 1000;
      final units = intAmount % 1000;

      if (units == 0) {
        return '${thousands.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.000';
      } else {
        return '${thousands.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.${units.toString().padLeft(3, '0')}';
      }
    } else {
      // Less than 1000
      return intAmount.toString();
    }
  }

  Future<void> _showBalanceUpdateNotification(
    Map<String, dynamic> payload,
  ) async {
    // Safe type casting with fallbacks
    final newBalance = (payload['newBalance'] is int)
        ? (payload['newBalance'] as int).toDouble()
        : (payload['newBalance'] as double? ?? 0.0);
    final accountNumber = payload['accountNumber'] as String? ?? '';
    final formattedBalance = _formatCurrencyVND(newBalance);

    await _showNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: 'Thông báo biến động số dư',
      body: 'TK: $accountNumber | SD: $formattedBalance VND',
      payload: jsonEncode(payload),
      color: Colors.blue,
    );
  }

  Future<void> _showInterestAddedNotification(
    Map<String, dynamic> payload,
  ) async {
    print('💰 Showing professional interest added notification');

    // Safe type casting with fallbacks
    final amount = (payload['amount'] is int)
        ? (payload['amount'] as int).toDouble()
        : (payload['amount'] as double? ?? 0.0);
    final description =
        payload['description'] as String? ?? 'Lãi suất tiết kiệm';
    final accountNumber = payload['accountNumber'] as String? ?? '';
    final transactionNumber = payload['transactionNumber'] as String? ?? '';
    final newBalance = (payload['newBalance'] is int)
        ? (payload['newBalance'] as int).toDouble()
        : (payload['newBalance'] as double? ?? 0.0);

    print('💰 Interest Amount: $amount (type: ${amount.runtimeType})');
    print('📝 Description: $description');
    print('🏦 Account: $accountNumber');
    print('🔢 Transaction: $transactionNumber');
    print('💳 New Balance: $newBalance');

    // Professional notification content - Banking style
    final title = '💰 Lãi suất đã được cộng';
    final body = _formatProfessionalInterestBody(
      amount: amount,
      description: description,
      accountNumber: accountNumber,
      transactionNumber: transactionNumber,
      newBalance: newBalance,
    );

    await _showProfessionalNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      payload: jsonEncode(payload),
      channelId: 'banking_transactions',
      channelName: 'Giao Dịch Ngân Hàng',
      color: Colors.green,
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: BigTextStyleInformation(
        body,
        htmlFormatBigText: true,
        contentTitle: title,
        htmlFormatContentTitle: true,
      ),
    );

    print('✅ Professional interest added notification sent');
  }

  String _formatProfessionalInterestBody({
    required double amount,
    required String description,
    required String accountNumber,
    required String transactionNumber,
    required double newBalance,
  }) {
    final formattedAmount = _formatCurrencyVND(amount);
    final formattedBalance = _formatCurrencyVND(newBalance);
    final timestamp = DateTime.now().toString().substring(
      11,
      19,
    ); // HH:MM:SS only

    return '''+$formattedAmount VND | $description | TK: $accountNumber | SD: $formattedBalance VND | $timestamp''';
  }

  Future<void> _showProfessionalNotification({
    required int id,
    required String title,
    required String body,
    required String payload,
    required String channelId,
    required String channelName,
    required Color color,
    Importance importance = Importance.high,
    Priority priority = Priority.high,
    String? largeIcon,
    String? bigText,
    StyleInformation? styleInformation,
  }) async {
    final AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
          channelId,
          channelName,
          channelDescription: 'Thông báo chuyên nghiệp từ Chidi Bank',
          importance: importance,
          priority: priority,
          color: color,
          playSound: true,
          enableVibration: true,
          showWhen: true,
          icon: '@mipmap/ic_launcher',
          ticker: 'Chidi Bank Notification',
          ongoing: false,
          autoCancel: true,
          fullScreenIntent: false,
          category: AndroidNotificationCategory.message,
          visibility: NotificationVisibility.public,
          showProgress: false,
          maxProgress: 0,
          onlyAlertOnce: false,
          channelShowBadge: true,
          enableLights: true,
          ledColor: color,
          ledOnMs: 1000,
          ledOffMs: 500,
          styleInformation: styleInformation,
        );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      sound: 'default',
      badgeNumber: 1,
      interruptionLevel: InterruptionLevel.active,
      categoryIdentifier: 'banking_notification',
      threadIdentifier: 'banking_thread',
    );

    final NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    try {
      await _notifications.show(
        id,
        title,
        body,
        notificationDetails,
        payload: payload,
      );
      print('✅ Professional notification displayed successfully');
    } catch (e) {
      print('❌ Failed to display professional notification: $e');
    }
  }

  Future<void> _showNotification({
    required int id,
    required String title,
    required String body,
    required String payload,
    required Color color,
    Importance importance = Importance.defaultImportance,
    Priority priority = Priority.defaultPriority,
  }) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
          'banking_notifications',
          'Banking Notifications',
          channelDescription:
              'Notifications for banking transactions and updates',
          importance: Importance.high,
          priority: Priority.high,
          color: Colors.blue,
          playSound: true,
          enableVibration: true,
          showWhen: true,
        );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    try {
      await _notifications.show(
        id,
        title,
        body,
        notificationDetails,
        payload: payload,
      );
      print('✅ Notification displayed successfully');
    } catch (e) {
      print('❌ Failed to display notification: $e');
    }
  }

  Future<void> _showNewNotification(Map<String, dynamic> payload) async {
    // Emit stream event to notify listeners (like dashboard) to update badge count
    _notificationStreamController.add(null);

    final title = payload['title'] as String? ?? 'Thông báo mới';
    final content = payload['content'] as String? ?? 'Bạn có thông báo mới';
    final notificationType = payload['type'] as String? ?? 'SYSTEM';
    final priority = payload['priority'] as String? ?? 'NORMAL';

    // Determine channel based on type
    String channelId = 'banking_system';
    String channelName = 'Hệ Thống Ngân Hàng';
    Color color = Colors.blue;
    Importance importance = Importance.defaultImportance;

    switch (notificationType) {
      case 'KYC':
        channelId = 'banking_security';
        channelName = 'Bảo Mật Chidi Bank';
        color = Colors.orange;
        importance = Importance.high;
        break;
      case 'TRANSACTION':
        channelId = 'banking_transactions';
        channelName = 'Giao Dịch Chidi Bank';
        color = Colors.green;
        importance = Importance.high;
        break;
      case 'ANNOUNCEMENT':
        channelId = 'banking_system';
        channelName = 'Hệ Thống Chidi Bank';
        color = Colors.blue;
        importance = Importance.defaultImportance;
        break;
      case 'SECURITY':
        channelId = 'banking_security';
        channelName = 'Bảo Mật Chidi Bank';
        color = Colors.red;
        importance = Importance.max;
        break;
    }

    // Adjust importance based on priority
    if (priority == 'HIGH' || priority == 'URGENT') {
      importance = Importance.max;
    }

    await _showProfessionalNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: content,
      payload: jsonEncode(payload),
      channelId: channelId,
      channelName: channelName,
      color: color,
      importance: importance,
      priority: priority == 'URGENT' ? Priority.max : Priority.high,
    );
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Handle notification tap
    final payload = response.payload;
    if (payload != null) {
      try {
        final data = jsonDecode(payload);
        print('Notification tapped: $data');
        // Navigate to appropriate screen based on notification type
        // This will be handled by the main app
      } catch (e) {
        print('Error parsing notification payload: $e');
      }
    }
  }

  Future<void> disconnect() async {
    print('🔌 Disconnecting WebSocket...');
    await _subscription?.cancel();
    _subscription = null;

    if (_channel != null) {
      await _channel!.sink.close();
      _channel = null;
    }

    print('✅ WebSocket disconnected');
  }

  Future<void> updateUserCredentials(String userId, String accessToken) async {
    // Check if credentials are the same
    if (_userId == userId && _accessToken == accessToken) {
      print('⚠️ Same credentials, skipping WebSocket reconnection');
      return;
    }

    _userId = userId;
    _accessToken = accessToken;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userId', userId);
    final refresh = await TokenStorage.readRefreshToken();
    await TokenStorage.writeTokens(
      accessToken: accessToken,
      refreshToken: refresh,
    );

    // Reconnect with new credentials
    await disconnect();
    await connectToWebSocket();
  }

  // Get connection status
  bool get isConnected => _channel != null && _subscription != null;

  // Get connection info for debugging
  Map<String, dynamic> getConnectionInfo() {
    return {
      'isConnected': isConnected,
      'userId': _userId,
      'hasAccessToken': _accessToken != null,
      'hasChannel': _channel != null,
      'hasSubscription': _subscription != null,
    };
  }

  // Manual notification for testing
  Future<void> showTestNotification() async {
    await _showProfessionalNotification(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: 'Test',
      body: 'Test notification',
      payload: jsonEncode({
        'type': 'test',
        'timestamp': DateTime.now().toIso8601String(),
      }),
      channelId: 'banking_system',
      channelName: 'Hệ Thống Ngân Hàng',
      color: Colors.blue,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
    );
  }
}
