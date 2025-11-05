// banking_flutter/lib/src/screens/notification/notification_list_screen.dart
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:provider/provider.dart';
import '../../services/notification_api_service.dart';
import '../../services/http_client.dart';
import '../../theme/theme_provider.dart';
import 'notification_detail_screen.dart';

class NotificationListScreen extends StatefulWidget {
  const NotificationListScreen({super.key});

  @override
  State<NotificationListScreen> createState() => _NotificationListScreenState();
}

class _NotificationListScreenState extends State<NotificationListScreen> {
  final NotificationApiService _notificationService = NotificationApiService(
    ApiClient(),
  );
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _currentPage = 0;
  final int _limit = 20;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();
  String? _selectedFilter;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _loadUnreadCount();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _hasMore) {
      _loadMoreNotifications();
    }
  }

  Future<void> _loadNotifications({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 0;
      _hasMore = true;
      _notifications.clear();
    }

    setState(() {
      _isLoading = !refresh;
      _isLoadingMore = refresh;
      _error = null;
    });

    try {
      final result = await _notificationService.getNotifications(
        limit: _limit,
        offset: _currentPage * _limit,
        isRead: _selectedFilter == 'read'
            ? true
            : _selectedFilter == 'unread'
            ? false
            : null,
      );

      final notifications = (result['notifications'] as List)
          .map((e) => e as Map<String, dynamic>)
          .toList();

      setState(() {
        if (refresh) {
          _notifications = notifications;
        } else {
          _notifications.addAll(notifications);
        }
        _hasMore = notifications.length == _limit;
        _currentPage++;
        _isLoading = false;
        _isLoadingMore = false;
      });

      await _loadUnreadCount();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
        _isLoadingMore = false;
      });
    }
  }

  Future<void> _loadMoreNotifications() async {
    if (_isLoadingMore || !_hasMore) return;
    await _loadNotifications();
  }

  Future<void> _loadUnreadCount() async {
    try {
      final count = await _notificationService.getUnreadCount();
      if (mounted) {
        setState(() {
          _unreadCount = count;
        });
      }
    } catch (e) {
      print('Error loading unread count: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _notificationService.markAllAsRead();
      await _loadNotifications(refresh: true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã đánh dấu tất cả thông báo đã đọc')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi: ${e.toString()}')));
      }
    }
  }

  Future<void> _onNotificationTap(Map<String, dynamic> notification) async {
    final notificationId = notification['id'] as String;
    final isRead = notification['isRead'] as bool? ?? false;

    if (!isRead) {
      try {
        await _notificationService.markAsRead(notificationId);
        setState(() {
          notification['isRead'] = true;
          notification['readAt'] = DateTime.now().toIso8601String();
        });
        await _loadUnreadCount();
      } catch (e) {
        print('Error marking notification as read: $e');
      }
    }

    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              NotificationDetailScreen(notificationId: notificationId),
        ),
      ).then((_) {
        _loadNotifications(refresh: true);
      });
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          if (difference.inMinutes == 0) {
            return 'Vừa xong';
          }
          return '${difference.inMinutes} phút trước';
        }
        return '${difference.inHours} giờ trước';
      } else if (difference.inDays == 1) {
        return 'Hôm qua';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} ngày trước';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateString;
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
        actions: [
          if (_unreadCount > 0)
            TextButton.icon(
              onPressed: _markAllAsRead,
              icon: Icon(
                Ionicons.checkmark_done,
                size: 20,
                color: Colors.white,
              ),
              label: Text('Đọc tất cả', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            color: themeProvider.backgroundColor,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('all', 'Tất cả', _selectedFilter == null),
                  const SizedBox(width: 8),
                  _buildFilterChip(
                    'unread',
                    'Chưa đọc',
                    _selectedFilter == 'unread',
                  ),
                  const SizedBox(width: 8),
                  _buildFilterChip('read', 'Đã đọc', _selectedFilter == 'read'),
                ],
              ),
            ),
          ),
          // Notification list
          Expanded(
            child: _isLoading && _notifications.isEmpty
                ? Center(
                    child: CircularProgressIndicator(
                      color: themeProvider.primaryColor,
                    ),
                  )
                : _error != null && _notifications.isEmpty
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
                          onPressed: () => _loadNotifications(refresh: true),
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  )
                : _notifications.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Ionicons.notifications_off_outline,
                          size: 64,
                          color: themeProvider.textSecondaryColor,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Chưa có thông báo nào',
                          style: TextStyle(
                            color: themeProvider.textSecondaryColor,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: () => _loadNotifications(refresh: true),
                    child: ListView.builder(
                      controller: _scrollController,
                      itemCount: _notifications.length + (_hasMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _notifications.length) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(
                                color: themeProvider.primaryColor,
                              ),
                            ),
                          );
                        }

                        final notification = _notifications[index];
                        final isRead = notification['isRead'] as bool? ?? false;
                        final title =
                            notification['title'] as String? ?? 'Thông báo';
                        final content =
                            notification['content'] as String? ?? '';
                        final createdAt = notification['createdAt'] as String?;

                        return InkWell(
                          onTap: () => _onNotificationTap(notification),
                          child: Container(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 6,
                            ),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: themeProvider.surfaceColor,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isRead
                                    ? Colors.transparent
                                    : themeProvider.primaryColor.withValues(
                                                alpha:
                                        0.3,
                                      ),
                                width: 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        title,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: themeProvider.textPrimaryColor,
                                        ),
                                      ),
                                    ),
                                    if (!isRead)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        margin: const EdgeInsets.only(
                                          left: 8,
                                          top: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: themeProvider.primaryColor,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                                if (content.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    content,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: themeProvider.textSecondaryColor,
                                      height: 1.4,
                                    ),
                                    maxLines: 3,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Text(
                                  _formatDate(createdAt),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: themeProvider.textSecondaryColor
                                        .withValues(
                                                alpha:0.6),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, bool isSelected) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = selected ? value : null;
        });
        _loadNotifications(refresh: true);
      },
      backgroundColor: themeProvider.surfaceColor,
      selectedColor: themeProvider.primaryColor.withValues(
                                                alpha:0.2),
      labelStyle: TextStyle(
        color: isSelected
            ? themeProvider.primaryColor
            : themeProvider.textPrimaryColor,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
      checkmarkColor: themeProvider.primaryColor,
    );
  }
}
