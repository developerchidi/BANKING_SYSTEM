// banking_flutter/lib/src/screens/notification/notification_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import '../../services/notification_api_service.dart';
import '../../services/http_client.dart';
import '../../theme/theme_provider.dart';
import 'package:provider/provider.dart';

class NotificationDetailScreen extends StatefulWidget {
  final String notificationId;

  const NotificationDetailScreen({super.key, required this.notificationId});

  @override
  State<NotificationDetailScreen> createState() =>
      _NotificationDetailScreenState();
}

class _NotificationDetailScreenState extends State<NotificationDetailScreen> {
  final NotificationApiService _notificationService = NotificationApiService(
    ApiClient(),
  );
  Map<String, dynamic>? _notification;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotification();
  }

  Future<void> _loadNotification() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notification = await _notificationService.getNotificationById(
        widget.notificationId,
      );
      setState(() {
        _notification = notification;
        _isLoading = false;
      });

      final isRead = notification['isRead'] as bool? ?? false;
      if (!isRead) {
        try {
          await _notificationService.markAsRead(widget.notificationId);
          setState(() {
            _notification?['isRead'] = true;
            _notification?['readAt'] = DateTime.now().toIso8601String();
          });
        } catch (e) {
          print('Error marking notification as read: $e');
        }
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      backgroundColor: themeProvider.backgroundColor,
      appBar: AppBar(
        backgroundColor: themeProvider.surfaceColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Ionicons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Thông Báo',
          style: TextStyle(color: themeProvider.textPrimaryColor),
        ),
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                color: themeProvider.primaryColor,
              ),
            )
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Ionicons.alert_circle_outline,
                    size: 64,
                    color: themeProvider.textSecondaryColor,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Có lỗi xảy ra',
                    style: TextStyle(
                      color: themeProvider.textSecondaryColor,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadNotification,
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            )
          : _notification == null
          ? Center(
              child: Text(
                'Không tìm thấy thông báo',
                style: TextStyle(color: themeProvider.textSecondaryColor),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  if (_notification?['title'] != null)
                    SelectableText(
                      _notification?['title'] as String,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: themeProvider.textPrimaryColor,
                        height: 1.4,
                      ),
                    ),
                  if (_notification?['title'] != null)
                    const SizedBox(height: 16),
                  // Content - simple note style, no container
                  SelectableText(
                    _notification?['content'] as String? ?? '',
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.6,
                      color: themeProvider.textPrimaryColor,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
