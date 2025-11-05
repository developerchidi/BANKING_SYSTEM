import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import '../../services/auth_service.dart';
import '../../services/card_service.dart';
import '../../services/notification_api_service.dart';
import '../../services/notification_service.dart';
import '../../models/account.dart';
import '../../models/transaction.dart';
import '../../theme/theme_provider.dart';
import '../transfer/transfer_type_screen.dart';
import '../transaction/transactions_screen.dart';
import '../transaction/transaction_detail_screen.dart';
import '../qr/account_qr_screen.dart';
import '../notification/notification_list_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with RouteAware {
  final BankingService _service = BankingService(ApiClient());
  final ApiClient _apiClient = ApiClient(); // For direct API calls
  final ValueNotifier<bool> _hideBalanceNotifier = ValueNotifier<bool>(false);

  // Cache variables
  List<Account>? _cachedAccounts;
  List<BankTransaction>? _cachedTransactions;
  List<CardDto>? _cachedCards;
  DateTime? _lastFetchTime;
  static const Duration _cacheExpiry = Duration(minutes: 5);
  bool _isRefreshing = false;
  final Set<String> _myAccountIds = {};
  bool? _cachedKycStatus;
  int _unreadNotificationCount = 0;
  final NotificationApiService _notificationService = NotificationApiService(
    ApiClient(),
  );

  late Future<String?> _tokenFut = SharedPreferences.getInstance().then(
    (p) => p.getString('accessToken'),
  );
  late Future<List<Account>> _accountsFut = _getAccountsWithCache();
  late Future<List<BankTransaction>> _txFut = _getTransactionsWithCache();
  late Future<List<CardDto>> _cardsFut = _getCardsWithCache();

  // Cache management methods
  bool _isCacheValid() {
    if (_lastFetchTime == null) return false;
    return DateTime.now().difference(_lastFetchTime!) < _cacheExpiry;
  }

  Future<List<Account>> _getAccountsWithCache() async {
    // Check authentication state first
    print(
      '🔐 Dashboard: Checking authentication state - isAuthenticated: ${AuthService.isAuthenticated.value}',
    );

    if (!AuthService.isAuthenticated.value) {
      print('🔐 Dashboard: User not authenticated, skipping accounts load');
      return [];
    }

    if (_isCacheValid() && _cachedAccounts != null) {
      return _cachedAccounts!;
    }
    final accounts = await _service.getAccounts(context: context);
    _cachedAccounts = accounts;
    _lastFetchTime = DateTime.now();
    _myAccountIds
      ..clear()
      ..addAll(accounts.map((e) => e.id));
    return accounts;
  }

  Future<List<BankTransaction>> _getTransactionsWithCache() async {
    // Check authentication state first
    print(
      '🔐 Dashboard: Checking authentication state - isAuthenticated: ${AuthService.isAuthenticated.value}',
    );

    if (!AuthService.isAuthenticated.value) {
      print('🔐 Dashboard: User not authenticated, skipping transactions load');
      return [];
    }

    if (_isCacheValid() && _cachedTransactions != null) {
      return _cachedTransactions!;
    }
    final transactions = await _service.getTransactions(limit: 10, offset: 0);
    _cachedTransactions = transactions;
    _lastFetchTime = DateTime.now();
    return transactions;
  }

  Future<List<CardDto>> _getCardsWithCache() async {
    // Check authentication state first
    print(
      '🔐 Dashboard: Checking authentication state - isAuthenticated: ${AuthService.isAuthenticated.value}',
    );

    if (!AuthService.isAuthenticated.value) {
      print('🔐 Dashboard: User not authenticated, skipping cards load');
      return [];
    }

    if (_isCacheValid() && _cachedCards != null) {
      return _cachedCards!;
    }
    final cards = await CardService.fetchMyCards();
    _cachedCards = cards;
    _lastFetchTime = DateTime.now();
    return cards;
  }

  void _invalidateCache() {
    _cachedAccounts = null;
    _cachedTransactions = null;
    _cachedCards = null;
    _lastFetchTime = null;
  }

  String _formatVnd(double value) {
    final s = value.toStringAsFixed(0);
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      final idx = s.length - i - 1;
      buf.write(s[i]);
      final left = s.length - i - 1;
      if (left > 0 && left % 3 == 0) buf.write(',');
    }
    return buf.toString();
  }

  StreamSubscription? _notificationStreamSubscription;

  @override
  void initState() {
    super.initState();
    print('📱 Dashboard: initState called');
    _loadData();
    _loadUnreadNotificationCount();
    _updateThemeFromUserData(); // Update theme provider with user tier

    // Listen to notification stream for realtime updates
    final notificationService = NotificationService();
    _notificationStreamSubscription = notificationService.notificationStream
        .listen((_) {
          // Refresh unread count when new notification arrives
          _loadUnreadNotificationCount();
        });
  }

  @override
  void dispose() {
    _notificationStreamSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadUnreadNotificationCount() async {
    try {
      final count = await _notificationService.getUnreadCount();
      if (mounted) {
        setState(() {
          _unreadNotificationCount = count;
        });
      }
    } catch (e) {
      print('Error loading unread notification count: $e');
    }
  }

  void _loadData() {
    print('📱 Dashboard: _loadData called');
    setState(() {
      _tokenFut = SharedPreferences.getInstance().then(
        (p) => p.getString('accessToken'),
      );
      _accountsFut = _getAccountsWithCache();
      _txFut = _getTransactionsWithCache();
      _cardsFut = _getCardsWithCache();
    });
  }

  Future<void> _forceRefreshData() async {
    setState(() {
      _isRefreshing = true;
    });

    _invalidateCache();
    setState(() {
      _tokenFut = SharedPreferences.getInstance().then(
        (p) => p.getString('accessToken'),
      );
      _accountsFut = _getAccountsWithCache();
      _txFut = _getTransactionsWithCache();
      _cardsFut = _getCardsWithCache();
    });

    await Future.wait([_accountsFut, _txFut, _cardsFut]);

    // Also refresh KYC status from server
    await _fetchKycStatusFromServer();

    setState(() {
      _isRefreshing = false;
    });
  }

  void _refreshData() {
    _loadData();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Update theme provider when screen becomes active
    _updateThemeFromUserData();
    
    if (mounted && !_isCacheValid()) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _refreshData();
        _refreshKycStatus(); // Refresh KYC status when returning to dashboard
      });
    }
  }

  // Refresh KYC status from server
  void _refreshKycStatus() {
    print('🔐 Dashboard: Refreshing KYC status from server');

    // Clear cache to force refresh
    _cachedKycStatus = null;

    _fetchKycStatusFromServer().then((isVerified) {
      print('🔐 Dashboard: KYC refresh result: $isVerified');
      if (mounted) {
        setState(() {
          // Trigger rebuild to update KYC status in UI
        });
      }
    });
  }

  void _navigateToTransactionsTab() {
    // Navigate to transactions tab by using a simple approach
    // Since we're in MainTabsScreen, we can use a callback or provider
    // For now, we'll use a simple navigation approach
    Navigator.of(context).pushNamed('/transaction');
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  Future<String> _readDisplayName() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user');

    if (userJson != null && userJson.isNotEmpty) {
      try {
        // Try to parse as JSON first
        final userData = jsonDecode(userJson);
        final firstName = userData['firstName'] ?? '';
        final lastName = userData['lastName'] ?? '';

        if (firstName.isNotEmpty || lastName.isNotEmpty) {
          return '$firstName $lastName'.trim();
        }

        // Fallback to email if no name available
        final email = userData['email'] ?? '';
        if (email.isNotEmpty) {
          return email.split('@').first; // Use email prefix as name
        }
      } catch (e) {
        print('🔐 Dashboard: JSON parsing failed, trying string parsing: $e');

        // Try to parse as string format: {id: ..., email: ..., firstName: ...}
        try {
          // Extract firstName from string format
          final firstNameMatch = RegExp(
            r'firstName:\s*([^,}]+)',
          ).firstMatch(userJson);
          final lastNameMatch = RegExp(
            r'lastName:\s*([^,}]+)',
          ).firstMatch(userJson);
          final emailMatch = RegExp(r'email:\s*([^,}]+)').firstMatch(userJson);

          String firstName = '';
          String lastName = '';
          String email = '';

          if (firstNameMatch != null) {
            firstName = firstNameMatch.group(1)?.trim() ?? '';
          }
          if (lastNameMatch != null) {
            lastName = lastNameMatch.group(1)?.trim() ?? '';
          }
          if (emailMatch != null) {
            email = emailMatch.group(1)?.trim() ?? '';
          }

          if (firstName.isNotEmpty || lastName.isNotEmpty) {
            return '$firstName $lastName'.trim();
          }

          if (email.isNotEmpty) {
            return email.split('@').first; // Use email prefix as name
          }
        } catch (e2) {
          print('🔐 Dashboard: String parsing also failed: $e2');
        }
      }
    }

    return ''; // Return empty string if no user data
  }

  Future<bool> _checkKycStatus() async {
    // Return cached value if available
    if (_cachedKycStatus != null) {
      return _cachedKycStatus!;
    }

    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user');

    print('🔐 Dashboard: Checking KYC status from local storage');
    print('🔐 Dashboard: User JSON: $userJson');

    if (userJson != null && userJson.isNotEmpty) {
      try {
        // Try to parse as JSON first
        final userData = jsonDecode(userJson);
        final isVerified = userData['isKycVerified'] == true;
        print('🔐 Dashboard: Parsed KYC status: $isVerified');

        // Cache the result
        _cachedKycStatus = isVerified;
        return isVerified;
      } catch (e) {
        print('🔐 Dashboard: JSON parsing failed for KYC check: $e');

        // Try to parse as string format
        try {
          final kycMatch = RegExp(
            r'isKycVerified:\s*([^,}]+)',
          ).firstMatch(userJson);
          if (kycMatch != null) {
            final kycValue = kycMatch.group(1)?.trim() ?? '';
            final isVerified = kycValue.toLowerCase() == 'true';
            print('🔐 Dashboard: Regex parsed KYC status: $isVerified');

            // Cache the result
            _cachedKycStatus = isVerified;
            return isVerified;
          }
        } catch (e2) {
          print('🔐 Dashboard: String parsing for KYC also failed: $e2');
        }
      }
    }

    print('🔐 Dashboard: No user data found for KYC check');

    // Cache default value
    _cachedKycStatus = false;
    return false; // Default to not verified
  }

  Future<String> _getUserTier() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (userJson != null) {
        final userData = jsonDecode(userJson);
        return userData['accountTier'] ?? 'BASIC';
      }
    } catch (e) {
      print('🔐 Dashboard: Tier check error: $e');
    }
    return 'BASIC';
  }

  // Update theme provider with user tier from SharedPreferences
  Future<void> _updateThemeFromUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (userJson != null && userJson.isNotEmpty) {
        try {
          final userData = jsonDecode(userJson);
          if (mounted) {
            final themeProvider = Provider.of<ThemeProvider>(
              context,
              listen: false,
            );
            themeProvider.updateUserTierFromUserData(userData);
            print(
              '🎨 Dashboard: Updated theme provider with tier: ${userData['accountTier']}',
            );
            print(
              '🎨 Dashboard: Primary color: ${themeProvider.primaryColor}',
            );
          }
        } catch (e) {
          print('🎨 Dashboard: Error updating theme: $e');
        }
      }
    } catch (e) {
      print('🎨 Dashboard: Error reading user data for theme: $e');
    }
  }

  Map<String, dynamic> _getTierInfo(String tier, ThemeProvider themeProvider) {
    switch (tier.toUpperCase()) {
      case 'STANDARD':
        return {
          'displayName': 'STANDARD',
          'icon': Icons.star_outline,
          'colors': [
            const Color(0xFF6B7280), // Gray
            const Color(0xFF9CA3AF), // Light Gray
            const Color(0xFF4B5563), // Medium Gray
          ],
          'shadowColor': const Color(0xFF6B7280),
        };
      case 'PREMIUM':
        return {
          'displayName': 'PREMIUM',
          'icon': Icons.workspace_premium,
          'colors': [
            themeProvider.accentColor,
            themeProvider.primaryColor,
            themeProvider.secondaryColor,
          ],
          'shadowColor': themeProvider.shadowColor,
        };
      case 'VIP':
        return {
          'displayName': 'VIP',
          'icon': Icons.diamond,
          'colors': [
            themeProvider.accentColor,
            themeProvider.primaryColor,
            themeProvider.secondaryColor,
          ],
          'shadowColor': themeProvider.shadowColor,
        };
      default:
        return {
          'displayName': 'BASIC',
          'icon': Icons.person,
          'colors': [
            const Color(0xFF4A90E2), // Blue
            const Color(0xFF6BB6FF), // Light Blue
            const Color(0xFF2E5BBA), // Dark Blue
          ],
          'shadowColor': const Color(0xFF4A90E2),
        };
    }
  }

  // Fetch fresh KYC status from server
  Future<bool> _fetchKycStatusFromServer() async {
    try {
      print('🔐 Dashboard: Fetching fresh KYC status from server');
      final token = await _getToken();
      if (token == null) {
        print('🔐 Dashboard: No token found for KYC status fetch');
        return false;
      }

      final response = await _apiClient.get('/api/auth/me');
      print('🔐 Dashboard: KYC status response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('🔐 Dashboard: Fresh response data: $responseData');

        // Extract user data from response
        final userData = responseData['data'];
        if (userData == null) {
          print('🔐 Dashboard: No user data in response');
          return false;
        }

        print('🔐 Dashboard: Fresh user data: $userData');

        // Update local storage with fresh data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user', jsonEncode(userData));

        // Update theme provider with fresh user data
        if (mounted) {
          final themeProvider = Provider.of<ThemeProvider>(
            context,
            listen: false,
          );
          themeProvider.updateUserTierFromUserData(userData);
          print(
            '🎨 Dashboard: Updated theme provider from server with tier: ${userData['accountTier']}',
          );
        }

        return userData['isKycVerified'] == true;
      } else {
        print(
          '🔐 Dashboard: Failed to fetch KYC status: ${response.statusCode}',
        );
        return false;
      }
    } catch (e) {
      print('🔐 Dashboard: Error fetching KYC status: $e');
      return false;
    }
  }

  void _openTransfer({Account? initial}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TransferTypeScreen(initialFrom: initial),
      ),
    );
  }

  void _openAccountQR(Account account) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AccountQRScreen(account: account),
      ),
    );
  }

  void _showKycRequiredDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Consumer<ThemeProvider>(
          builder: (context, themeProvider, child) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: Row(
                children: [
                  Icon(
                    Ionicons.warning_outline,
                    color: const Color(0xFFE67E22),
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Cần xác thực KYC',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ],
              ),
              content: const Text(
                'Bạn cần hoàn thành xác thực KYC để sử dụng tính năng này. Vui lòng thực hiện xác thực danh tính trước.',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF6B7280),
                  height: 1.5,
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'Đóng',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    // Navigate to KYC capture screen
                    Navigator.pushNamed(context, '/kyc-capture', arguments: {});
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: themeProvider.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                  ),
                  child: const Text(
                    'Xác thực KYC',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _topBar() {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: themeProvider.primaryColor.withOpacity(0.1),
                child: Icon(
                  Ionicons.person_outline,
                  color: themeProvider.primaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FutureBuilder<String>(
                  future: _readDisplayName(),
                  builder: (context, snap) {
                    final name = snap.data ?? '';
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _greeting(),
                          style: TextStyle(
                            fontSize: 12,
                            color: themeProvider.textSecondaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                name.isEmpty ? 'Người dùng' : name,
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: themeProvider.textPrimaryColor,
                                  fontSize: 16,
                                ),
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ),
                            const SizedBox(width: 8),
                            FutureBuilder<bool>(
                              future: _checkKycStatus(),
                              builder: (context, kycSnap) {
                                final isKycVerified = kycSnap.data ?? false;
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isKycVerified
                                        ? const Color(
                                            0xFF27AE60,
                                          ).withOpacity(0.1)
                                        : const Color(
                                            0xFFE67E22,
                                          ).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isKycVerified
                                          ? const Color(0xFF27AE60)
                                          : const Color(0xFFE67E22),
                                      width: 1,
                                    ),
                                  ),
                                  child: Text(
                                    isKycVerified ? 'KYC ✓' : 'KYC ⚠',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: isKycVerified
                                          ? const Color(0xFF27AE60)
                                          : const Color(0xFFE67E22),
                                    ),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(width: 6),
                            FutureBuilder<String>(
                              future: _getUserTier(),
                              builder: (context, tierSnap) {
                                final tier = tierSnap.data ?? 'BASIC';
                                // Chỉ hiển thị tier nếu không phải BASIC
                                if (tier == 'BASIC') {
                                  return const SizedBox.shrink();
                                }

                                return Consumer<ThemeProvider>(
                                  builder: (context, themeProvider, child) {
                                    final tierInfo = _getTierInfo(
                                      tier,
                                      themeProvider,
                                    );
                                    return Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: tierInfo['colors'],
                                          stops: const [0.0, 0.5, 1.0],
                                        ),
                                        borderRadius: BorderRadius.circular(8),
                                        boxShadow: [
                                          BoxShadow(
                                            color: tierInfo['shadowColor']
                                                .withOpacity(0.3),
                                            blurRadius: 4,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            tierInfo['icon'],
                                            size: 10,
                                            color: Colors.white,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            tierInfo['displayName'],
                                            style: const TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),
              ),
              Stack(
                children: [
                  IconButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const NotificationListScreen(),
                        ),
                      ).then((_) {
                        // Refresh unread count when returning
                        _loadUnreadNotificationCount();
                      });
                    },
                    icon: Icon(
                      Ionicons.notifications_outline,
                      color: themeProvider.textSecondaryColor,
                      size: 24,
                    ),
                  ),
                  if (_unreadNotificationCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Theme.of(context).scaffoldBackgroundColor,
                            width: 2,
                          ),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          _unreadNotificationCount > 99
                              ? '99+'
                              : _unreadNotificationCount.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              IconButton(
                onPressed: () {},
                icon: Icon(
                  Ionicons.search_outline,
                  color: themeProvider.textSecondaryColor,
                  size: 24,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _quickActions() {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        Widget btn(
          IconData icon,
          String label,
          VoidCallback onTap, {
          bool requiresKyc = false,
        }) {
          return FutureBuilder<bool>(
            future: requiresKyc ? _checkKycStatus() : Future.value(true),
            builder: (context, kycSnap) {
              final isKycVerified = kycSnap.data ?? false;
              final isDisabled = requiresKyc && !isKycVerified;

              return InkWell(
                onTap: isDisabled ? () => _showKycRequiredDialog() : onTap,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: isDisabled
                        ? const Color(0xFF1A1A1A)
                        : const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: themeProvider.primaryColor.withOpacity(0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                    border: Border.all(
                      color: isDisabled
                          ? Colors.grey.withOpacity(0.3)
                          : themeProvider.primaryColor.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isDisabled
                              ? Colors.grey.withOpacity(0.1)
                              : themeProvider.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDisabled
                                ? Colors.grey.withOpacity(0.3)
                                : themeProvider.primaryColor.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Icon(
                          icon,
                          color: isDisabled
                              ? Colors.grey
                              : themeProvider.primaryColor,
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        label,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: isDisabled
                              ? Colors.grey
                              : const Color(0xFFFFFFFF),
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (isDisabled) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Cần KYC',
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[600],
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        }

        return Row(
          children: [
            Expanded(
              child: btn(
                Ionicons.swap_horizontal_outline,
                'Chuyển tiền',
                () => _openTransfer(),
                requiresKyc: true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: btn(
                Ionicons.receipt_outline,
                'Lịch sử',
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TransactionsScreen(),
                  ),
                ),
                requiresKyc: false, // Lịch sử không cần KYC
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: btn(
                Ionicons.card_outline,
                'Thẻ',
                () {},
                requiresKyc: true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: btn(
                Ionicons.trending_up_outline,
                'Lãi suất',
                () {
                  Navigator.pushNamed(context, '/interest');
                },
                requiresKyc: false, // Lãi suất không cần KYC
              ),
            ),
          ],
        );
      },
    );
  }

  Color _amountColor(BankTransaction t) {
    return _isTransactionCredit(t)
        ? const Color(0xFF10B981)
        : const Color(0xFFEF4444);
  }

  bool _isTransactionCredit(BankTransaction t) {
    if (_myAccountIds.isEmpty) return t.receiverAccountId != t.senderAccountId;
    if (t.receiverAccountId != null &&
        _myAccountIds.contains(t.receiverAccountId!))
      return true;
    if (t.senderAccountId != null && _myAccountIds.contains(t.senderAccountId!))
      return false;
    if (t.receiverAccount != null &&
        _myAccountIds.contains(t.receiverAccount!.id))
      return true;
    if (t.senderAccount != null && _myAccountIds.contains(t.senderAccount!.id))
      return false;
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Scaffold(
          extendBody: true,
          backgroundColor: themeProvider.backgroundColor,
          body: FutureBuilder<String?>(
            future: _tokenFut,
            builder: (context, tokenSnap) {
              if (tokenSnap.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if ((tokenSnap.data ?? '').isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Bạn chưa đăng nhập',
                        style: TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () =>
                            Navigator.of(context).pushReplacementNamed('/'),
                        child: const Text('Đến màn đăng nhập'),
                      ),
                    ],
                  ),
                );
              }

              return SafeArea(
                child: RefreshIndicator(
                  onRefresh: () async {
                    await _forceRefreshData();
                  },
                  color: themeProvider.primaryColor,
                  backgroundColor: themeProvider.surfaceColor,
                  strokeWidth: 2.0,
                  displacement: 40.0,
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      // App bar
                      SliverToBoxAdapter(child: _topBar()),

                      // Balance card
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: themeProvider.gradient,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: themeProvider.shadowColor,
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: FutureBuilder<List<Account>>(
                                future: _accountsFut,
                                builder: (context, snap) {
                                  if (snap.connectionState ==
                                      ConnectionState.waiting) {
                                    return const SizedBox(
                                      height: 80,
                                      child: Center(
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                        ),
                                      ),
                                    );
                                  }
                                  if (snap.hasError) {
                                    return const Text(
                                      'Lỗi tải số dư',
                                      style: TextStyle(color: Colors.white),
                                    );
                                  }
                                  final accounts = snap.data ?? [];
                                  if (accounts.isEmpty) {
                                    return const Text(
                                      'Chưa có tài khoản',
                                      style: TextStyle(color: Colors.white),
                                    );
                                  }
                                  final totalBalance = accounts.fold<double>(
                                    0,
                                    (sum, a) => sum + a.balance,
                                  );
                                  return Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text(
                                            'Tổng số dư',
                                            style: TextStyle(
                                              color: Colors.white70,
                                              fontSize: 14,
                                            ),
                                          ),
                                          ValueListenableBuilder<bool>(
                                            valueListenable:
                                                _hideBalanceNotifier,
                                            builder: (context, hide, child) {
                                              return IconButton(
                                                onPressed: () =>
                                                    _hideBalanceNotifier.value =
                                                        !hide,
                                                icon: Icon(
                                                  hide
                                                      ? Ionicons.eye_off_outline
                                                      : Ionicons.eye_outline,
                                                  color: Colors.white70,
                                                ),
                                              );
                                            },
                                          ),
                                        ],
                                      ),
                                      ValueListenableBuilder<bool>(
                                        valueListenable: _hideBalanceNotifier,
                                        builder: (context, hide, child) {
                                          return Text(
                                            hide
                                                ? '•••••••• VND'
                                                : '${_formatVnd(totalBalance)} VND',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 28,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          );
                                        },
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          // Percentage label
                                          FutureBuilder<List<BankTransaction>>(
                                            future: _service.getTransactions(
                                              startDate: DateTime.now()
                                                  .subtract(
                                                    const Duration(days: 30),
                                                  ),
                                              endDate: DateTime.now(),
                                              limit: 1,
                                              offset: 0,
                                            ),
                                            builder: (context, snap) {
                                              String label = '+0.0% tháng này';
                                              if (snap.hasData &&
                                                  snap.data!.isNotEmpty &&
                                                  _isTransactionCredit(
                                                    snap.data!.first,
                                                  )) {
                                                label = '+2.3% tháng này';
                                              }
                                              return Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 12,
                                                      vertical: 6,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: Colors.white
                                                      .withOpacity(0.15),
                                                  borderRadius:
                                                      BorderRadius.circular(20),
                                                ),
                                                child: Text(
                                                  label,
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                                          // QR Code Button
                                          if (accounts.isNotEmpty)
                                            GestureDetector(
                                              onTap: () => _openAccountQR(
                                                accounts.first,
                                              ),
                                              child: Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 12,
                                                      vertical: 8,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: Colors.white
                                                      .withOpacity(0.2),
                                                  borderRadius:
                                                      BorderRadius.circular(20),
                                                  border: Border.all(
                                                    color: Colors.white
                                                        .withOpacity(0.3),
                                                    width: 1,
                                                  ),
                                                ),
                                                child: Row(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: [
                                                    const Icon(
                                                      Ionicons.qr_code_outline,
                                                      color: Colors.white,
                                                      size: 16,
                                                    ),
                                                    const SizedBox(width: 6),
                                                    const Text(
                                                      'QR Code',
                                                      style: TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 12,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Quick actions
                      SliverToBoxAdapter(child: const SizedBox(height: 8)),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Container(
                            decoration: BoxDecoration(
                              color: themeProvider.surfaceColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: themeProvider.primaryColor.withOpacity(
                                  0.3,
                                ),
                                width: 1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: themeProvider.primaryColor.withOpacity(
                                    0.2,
                                  ),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Thao tác nhanh',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: themeProvider.textPrimaryColor,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  _quickActions(),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Accounts section
                      SliverToBoxAdapter(child: const SizedBox(height: 20)),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                          child: Text(
                            'Thẻ của tôi',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: themeProvider.textPrimaryColor,
                            ),
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: FutureBuilder<List<CardDto>>(
                          future: _cardsFut,
                          builder: (context, snap) {
                            if (snap.connectionState ==
                                ConnectionState.waiting) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16),
                                child: SizedBox(
                                  height: 80,
                                  child: Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                ),
                              );
                            }
                            if (snap.hasError) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                                child: Text('Lỗi: ${snap.error}'),
                              );
                            }
                            final cards = snap.data ?? [];
                            if (cards.isEmpty) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16),
                                child: Text('Chưa có thẻ'),
                              );
                            }
                            return SizedBox(
                              height: 200,
                              child: ListView.separated(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                                scrollDirection: Axis.horizontal,
                                itemCount: cards.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 14),
                                itemBuilder: (_, i) {
                                  final card = cards[i];
                                  final dark = i.isOdd;
                                  final width =
                                      (MediaQuery.of(context).size.width - 48)
                                          .clamp(280.0, 400.0);
                                  return GestureDetector(
                                    onTap: () {
                                      // Navigate to cards list screen
                                      Navigator.pushNamed(context, '/cards');
                                    },
                                    child: Container(
                                      width: width,
                                      decoration: BoxDecoration(
                                        gradient: themeProvider.gradient,
                                        borderRadius: BorderRadius.circular(18),
                                        boxShadow: [
                                          BoxShadow(
                                            color: themeProvider.shadowColor,
                                            blurRadius: 20,
                                            offset: const Offset(0, 10),
                                          ),
                                          BoxShadow(
                                            color: Colors.black.withValues(
                                              alpha: 0.3,
                                            ),
                                            blurRadius: 10,
                                            offset: const Offset(0, 5),
                                          ),
                                        ],
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              card.brand,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                            Text(
                                              'Số thẻ\n${card.masked}',
                                              style: const TextStyle(
                                                color: Colors.white70,
                                              ),
                                            ),
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                const Text(
                                                  'Trạng thái',
                                                  style: TextStyle(
                                                    color: Colors.white70,
                                                  ),
                                                ),
                                                Text(
                                                  card.isBlocked
                                                      ? 'Đã khóa'
                                                      : 'Hoạt động',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    color: card.isBlocked
                                                        ? const Color(
                                                            0xFFFF6B6B,
                                                          )
                                                        : const Color(
                                                            0xFF4CAF50,
                                                          ),
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                        ),
                      ),

                      // Services grid
                      SliverToBoxAdapter(child: const SizedBox(height: 20)),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Container(
                            decoration: BoxDecoration(
                              color: themeProvider.surfaceColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: themeProvider.primaryColor.withOpacity(
                                  0.3,
                                ),
                                width: 1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: themeProvider.primaryColor.withOpacity(
                                    0.2,
                                  ),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Dịch vụ',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: themeProvider.textPrimaryColor,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  GridView.count(
                                    crossAxisCount: 4,
                                    childAspectRatio: 0.85,
                                    mainAxisSpacing: 12,
                                    crossAxisSpacing: 12,
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    children: const [
                                      _ServiceTile(
                                        icon: Ionicons.phone_portrait_outline,
                                        label: 'Nạp điện\nthoại',
                                      ),
                                      _ServiceTile(
                                        icon: Ionicons.flash_outline,
                                        label: 'Điện -\nNước',
                                      ),
                                      _ServiceTile(
                                        icon: Ionicons.car_outline,
                                        label: 'Bảo\nhiểm',
                                      ),
                                      _ServiceTile(
                                        icon: Ionicons.home_outline,
                                        label: 'Vay vốn',
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Recent transactions
                      SliverToBoxAdapter(child: const SizedBox(height: 20)),
                      SliverToBoxAdapter(
                        child: FutureBuilder<List<BankTransaction>>(
                          future: _txFut,
                          builder: (context, snap) {
                            if (snap.connectionState ==
                                ConnectionState.waiting) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16),
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            if (snap.hasError) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                                child: Text('Lỗi: ${snap.error}'),
                              );
                            }
                            final items = snap.data ?? [];
                            if (items.isEmpty) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16),
                                child: Text('Chưa có giao dịch'),
                              );
                            }
                            return Column(
                              children: [
                                // Header with "Xem tất cả" button
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Giao dịch gần đây',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w700,
                                          color: themeProvider.textPrimaryColor,
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          // Navigate to Transactions tab using a different approach
                                          // We'll use a callback or provider pattern
                                          _navigateToTransactionsTab();
                                        },
                                        child: Text(
                                          'Xem tất cả',
                                          style: TextStyle(
                                            color: themeProvider.primaryColor,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                ListView.separated(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                  ),
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemCount: items.length.clamp(0, 5),
                                  separatorBuilder: (_, __) => Divider(
                                    height: 1,
                                    color: themeProvider.primaryColor
                                        .withOpacity(0.2),
                                  ),
                                  itemBuilder: (_, i) {
                                    final t = items[i];
                                    return ListTile(
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                            horizontal: 0,
                                          ),
                                      leading: CircleAvatar(
                                        backgroundColor: themeProvider
                                            .primaryColor
                                            .withOpacity(0.12),
                                        child: Icon(
                                          _isTransactionCredit(t)
                                              ? Ionicons
                                                    .arrow_down_circle_outline
                                              : Ionicons
                                                    .arrow_up_circle_outline,
                                          color: themeProvider.primaryColor,
                                        ),
                                      ),
                                      title: Text(
                                        t.description ?? 'Giao dịch',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: themeProvider.textPrimaryColor,
                                        ),
                                      ),
                                      subtitle: Text(
                                        '${t.createdAt.toLocal()}'
                                            .split('.')
                                            .first,
                                        style: TextStyle(
                                          color:
                                              themeProvider.textSecondaryColor,
                                        ),
                                      ),
                                      trailing: Builder(
                                        builder: (_) {
                                          final isCredit = _isTransactionCredit(
                                            t,
                                          );
                                          final displayAmount = t.amount;
                                          return Text(
                                            (isCredit ? '+ ' : '- ') +
                                                _formatVnd(displayAmount) +
                                                ' VND',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w800,
                                              color: _amountColor(t),
                                            ),
                                          );
                                        },
                                      ),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                TransactionDetailScreen(
                                                  transaction: t,
                                                ),
                                          ),
                                        );
                                      },
                                    );
                                  },
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                      // Spacer to avoid overlapping bottom bar (glass)
                      // const SliverToBoxAdapter(child: SizedBox(height: 96)),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _ServiceTile extends StatelessWidget {
  final IconData icon;
  final String label;

  const _ServiceTile({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return InkWell(
          onTap: () {},
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: themeProvider.surfaceColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: themeProvider.primaryColor.withOpacity(0.3),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: themeProvider.primaryColor.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: themeProvider.primaryColor, size: 24),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: themeProvider.textPrimaryColor,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
