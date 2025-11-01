import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';
import '../../services/http_client.dart';
import '../../services/banking_service.dart';
import '../../services/tier_service.dart';
import '../../theme/theme_provider.dart';
import '../../theme/fintech_theme.dart';
import '../vanity/vanity_selection_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _notificationsEnabled = true;
  String _language = 'vi';
  String _themeMode = 'light';

  dynamic _getNested(String key1, [String? key2]) {
    try {
      if (_userData == null) return null;
      final v1 = _userData![key1];
      if (key2 == null) return v1;
      if (v1 is Map<String, dynamic>) return v1[key2];
      return null;
    } catch (_) {
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadPrefs();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Refresh user data when screen becomes active
    _loadUserData();

    // Update theme provider with user tier
    if (_userData != null) {
      final themeProvider = Provider.of<ThemeProvider>(context, listen: false);
      themeProvider.updateUserTierFromUserData(_userData!);
    }
  }

  Future<void> _loadUserData() async {
    try {
      print('👤 Profile: Fetching /auth/me ...');
      final apiClient = ApiClient();
      final response = await apiClient.get('/api/auth/me');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = data['data'] ?? data['user'];
        if (mounted) {
          setState(() {
            _userData = user is Map<String, dynamic> ? user : null;
            _isLoading = false;
          });

          // Update theme provider with new user data
          if (_userData != null) {
            final themeProvider = Provider.of<ThemeProvider>(
              context,
              listen: false,
            );
            themeProvider.updateUserTierFromUserData(_userData!);
          }
        }
        // Cache to prefs for offline/fallback
        if (user != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', jsonEncode(user));
        }
        return;
      }
      print(
        '👤 Profile: /auth/me failed ${response.statusCode}, fallback to prefs',
      );
    } catch (e) {
      print('👤 Profile: /auth/me error: $e');
    }

    // Fallback: SharedPreferences → AuthProvider
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString != null) {
        final user = jsonDecode(userString);
        if (mounted) {
          setState(() {
            _userData = user;
            _isLoading = false;
          });

          // Update theme provider with fallback user data
          if (_userData != null) {
            final themeProvider = Provider.of<ThemeProvider>(
              context,
              listen: false,
            );
            themeProvider.updateUserTierFromUserData(_userData!);
          }
        }
      } else {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        if (mounted) {
          setState(() {
            _userData = authProvider.user;
            _isLoading = false;
          });

          // Update theme provider with auth provider user data
          if (_userData != null) {
            final themeProvider = Provider.of<ThemeProvider>(
              context,
              listen: false,
            );
            themeProvider.updateUserTierFromUserData(_userData!);
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
        _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
        _language = prefs.getString('language') ?? 'vi';
        _themeMode = prefs.getString('theme') ?? 'light';
      });
    } catch (_) {}
  }

  Future<void> _savePrefs({
    bool? notifications,
    String? language,
    String? theme,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    if (notifications != null)
      await prefs.setBool('notifications_enabled', notifications);
    if (language != null) await prefs.setString('language', language);
    if (theme != null) await prefs.setString('theme', theme);
  }

  Future<void> _openVanity() async {
    try {
      final service = BankingService(ApiClient());
      final accounts = await service.getAccounts(context: context);
      if (accounts.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không tìm thấy tài khoản để đổi số')),
        );
        return;
      }
      if (!mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => VanitySelectionScreen(fromAccount: accounts.first),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Không thể tải tài khoản: $e')));
    }
  }

  Future<void> _showChangePasswordDialog() async {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.lock_outline,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Đổi mật khẩu',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentCtrl,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Mật khẩu hiện tại',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.lock_outline, size: 20),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: newCtrl,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Mật khẩu mới',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.lock, size: 20),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: confirmCtrl,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Xác nhận mật khẩu mới',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.lock_reset, size: 20),
              ),
            ),
          ],
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Cập nhật',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (result == true) {
      if (newCtrl.text.trim() != confirmCtrl.text.trim() ||
          newCtrl.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Mật khẩu mới không khớp'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      final service = AuthService(ApiClient());
      final res = await service.changePassword(
        currentPassword: currentCtrl.text.trim(),
        newPassword: newCtrl.text.trim(),
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? ''),
          backgroundColor: (res['success'] == true)
              ? const Color(0xFF10B981)
              : Colors.red,
        ),
      );
    }
  }

  Future<void> _showTwoFADialog() async {
    bool tempEnabled = (_userData?['twoFactorEnabled'] == true);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.phone_android,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Xác thực 2FA',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: StatefulBuilder(
          builder: (context, setStateSB) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SwitchListTile(
                  title: const Text(
                    'Bật xác thực hai lớp',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  subtitle: const Text(
                    'Yêu cầu mật khẩu để xác nhận thay đổi',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                  value: tempEnabled,
                  onChanged: (v) => setStateSB(() => tempEnabled = v),
                  activeColor: const Color(0xFF8B5CF6),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Lưu',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (ok == true) {
      // Bỏ qua nếu không thay đổi trạng thái
      final currentEnabled = (_userData?['twoFactorEnabled'] == true);
      if (tempEnabled == currentEnabled) return;

      // Yêu cầu mật khẩu ở modal riêng
      final password = await _promptPassword();
      if (password == null || password.isEmpty) return;

      final service = AuthService(ApiClient());
      final res = tempEnabled
          ? await service.enableTwoFactor(password)
          : await service.disableTwoFactor(password);
      if (!mounted) return;

      // Refresh user data after 2FA status change
      if (res['success'] == true) {
        await context.read<AuthProvider>().refreshUserData();
        await _loadUserData();
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? ''),
          backgroundColor: (res['success'] == true)
              ? const Color(0xFF10B981)
              : Colors.red,
        ),
      );
    }
  }

  Future<String?> _promptPassword() async {
    final ctrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.lock_outline,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Xác nhận mật khẩu',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: 460,
          child: TextField(
            controller: ctrl,
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'Nhập mật khẩu',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              prefixIcon: const Icon(Icons.password, size: 20),
            ),
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    if (ctrl.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Vui lòng nhập mật khẩu xác nhận'),
                          backgroundColor: Colors.red,
                        ),
                      );
                      return;
                    }
                    Navigator.pop(context, true);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Xác nhận',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (confirmed == true) {
      return ctrl.text.trim();
    }
    return null;
  }

  Widget _buildEmailVerifyBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7), // warm subtle background
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.email_outlined,
              color: Color(0xFFF59E0B),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Bạn chưa xác thực email. Hãy xác thực để bảo vệ tài khoản và nhận đủ tính năng.',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF92400E),
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            height: 40,
            child: TextButton(
              onPressed: () async {
                final res = await AuthService(
                  ApiClient(),
                ).resendEmailVerification();
                if (!mounted) return;
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text(res['message'] ?? '')));
              },
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF6C5CE7),
                minimumSize: const Size(0, 40),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Gửi lại'),
            ),
          ),
          const SizedBox(width: 6),
          SizedBox(
            height: 40,
            child: ElevatedButton(
              onPressed: () async {
                // Gửi mã trước khi mở dialog nhập mã
                final send = await AuthService(
                  ApiClient(),
                ).resendEmailVerification();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(send['message'] ?? '')),
                  );
                }
                final token = await _promptVerificationToken();
                if (token == null || token.isEmpty) return;
                final res = await AuthService(ApiClient()).verifyEmail(token);
                if (!mounted) return;
                if (res['success'] == true) {
                  await _loadUserData();
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? ''),
                    backgroundColor: (res['success'] == true)
                        ? const Color(0xFF10B981)
                        : Colors.red,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6C5CE7),
                foregroundColor: Colors.white,
                minimumSize: const Size(0, 40),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text('Xác thực'),
            ),
          ),
        ],
      ),
    );
  }

  Future<String?> _promptVerificationToken() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF6C5CE7).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.email_outlined,
                color: Color(0xFF6C5CE7),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Nhập mã xác thực email',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: TextField(
          controller: ctrl,
          decoration: InputDecoration(
            labelText: 'Mã xác thực',
            hintText: 'Nhập token từ email',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            prefixIcon: const Icon(Icons.key_outlined, size: 20),
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C5CE7),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Xác nhận',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (ok == true) return ctrl.text.trim();
    return null;
  }

  Future<void> _showChangePhoneDialog() async {
    final ctrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.phone_outlined,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Đổi số điện thoại',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: 460,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: ctrl,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Số điện thoại mới',
                  hintText: 'Nhập số điện thoại mới',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.phone, size: 20),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Số điện thoại mới sẽ cần được xác thực trước khi có hiệu lực.',
                style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
            ],
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Hủy'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    if (ctrl.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Vui lòng nhập số điện thoại'),
                        ),
                      );
                      return;
                    }
                    Navigator.pop(context, true);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Tiếp tục'),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (confirmed == true && ctrl.text.trim().isNotEmpty) {
      // TODO: Implement phone change logic
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Chức năng đổi số điện thoại sẽ được triển khai sớm'),
          backgroundColor: const Color(0xFF8B5CF6),
        ),
      );
    }
  }

  Future<void> _showChangeEmailDialog() async {
    // B1: Nhập email mới (không hỏi mật khẩu ở bước này)
    final emailCtrl = TextEditingController(text: '');
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF6C5CE7).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.email_outlined,
                color: Color(0xFF6C5CE7),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Đổi email',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: 460,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email mới',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.alternate_email, size: 20),
                ),
              ),
            ],
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C5CE7),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Tiếp tục',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (ok == true) {
      final email = emailCtrl.text.trim();
      if (email.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng nhập email mới')),
        );
        return;
      }
      final service = AuthService(ApiClient());
      // Kiểm tra trùng mail trên DB
      final available = await service.isEmailAvailable(email);
      if (!available) {
        if (!mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Email đã được sử dụng')));
        return;
      }

      // B2: Xác thực mật khẩu hiện tại
      final password = await _promptPassword();
      if (password == null || password.isEmpty) return;

      // Đổi email → backend gửi mã 6 số
      final res = await service.changeEmail(
        newEmail: email,
        password: password,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(res['message'] ?? '')));
      if (res['success'] == true) {
        // B3: Nhập mã xác thực email
        final code = await _promptVerificationToken();
        if (code != null && code.isNotEmpty) {
          final vr = await service.verifyEmail(code);
          if (!mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(vr['message'] ?? '')));
          if (vr['success'] == true) {
            await _loadUserData();
          }
        }
      }
    }
  }

  Future<void> _showNotificationsDialog() async {
    bool temp = _notificationsEnabled;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.notifications_outlined,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Thông báo',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: StatefulBuilder(
          builder: (context, setStateSB) => Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
            ),
            child: SwitchListTile(
              title: const Text(
                'Bật thông báo',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1F2937),
                ),
              ),
              subtitle: const Text(
                'Nhận thông báo về giao dịch và cập nhật',
                style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              value: temp,
              onChanged: (v) => setStateSB(() => temp = v),
              activeColor: const Color(0xFF8B5CF6),
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Lưu',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (ok == true) {
      setState(() => _notificationsEnabled = temp);
      await _savePrefs(notifications: temp);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đã lưu cài đặt thông báo')));
    }
  }

  Future<void> _showLanguageDialog() async {
    String temp = _language;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.language,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Ngôn ngữ',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: StatefulBuilder(
          builder: (context, setStateSB) => Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                RadioListTile<String>(
                  title: const Text(
                    'Tiếng Việt',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  subtitle: const Text(
                    'Vietnamese',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                  value: 'vi',
                  groupValue: temp,
                  onChanged: (v) => setStateSB(() => temp = v ?? 'vi'),
                  activeColor: const Color(0xFF8B5CF6),
                  contentPadding: EdgeInsets.zero,
                ),
                const Divider(height: 1),
                RadioListTile<String>(
                  title: const Text(
                    'English',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  subtitle: const Text(
                    'English',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                  value: 'en',
                  groupValue: temp,
                  onChanged: (v) => setStateSB(() => temp = v ?? 'vi'),
                  activeColor: const Color(0xFF8B5CF6),
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Lưu',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (ok == true) {
      setState(() => _language = temp);
      await _savePrefs(language: temp);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đã lưu ngôn ngữ')));
    }
  }

  Future<void> _showThemeDialog() async {
    String temp = _themeMode;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.palette_outlined,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Chủ đề',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        content: StatefulBuilder(
          builder: (context, setStateSB) => Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                RadioListTile<String>(
                  title: const Text(
                    'Sáng',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  subtitle: const Text(
                    'Light theme',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                  value: 'light',
                  groupValue: temp,
                  onChanged: (v) => setStateSB(() => temp = v ?? 'light'),
                  activeColor: const Color(0xFF8B5CF6),
                  contentPadding: EdgeInsets.zero,
                ),
                const Divider(height: 1),
                RadioListTile<String>(
                  title: const Text(
                    'Tối',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  subtitle: const Text(
                    'Dark theme',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                  value: 'dark',
                  groupValue: temp,
                  onChanged: (v) => setStateSB(() => temp = v ?? 'light'),
                  activeColor: const Color(0xFF8B5CF6),
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Lưu',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (ok == true) {
      setState(() => _themeMode = temp);
      await _savePrefs(theme: temp);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đã lưu chủ đề')));
    }
  }

  Future<void> _logout() async {
    // Show confirmation dialog
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Đăng xuất',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2C3E50),
          ),
        ),
        content: const Text(
          'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
          style: TextStyle(fontSize: 16, color: Color(0xFF7F8C8D)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text(
              'Hủy',
              style: TextStyle(
                color: Color(0xFF7F8C8D),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE74C3C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Đăng xuất',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (shouldLogout == true) {
      await AuthService.logout();
      if (mounted) {
        Navigator.of(
          context,
        ).pushNamedAndRemoveUntil('/login', (route) => false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(const Color(0xFF6C5CE7)),
          ),
        ),
      );
    }

    // Fallback UI when no user data
    if (_userData == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF3F4F6),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF6C5CE7).withOpacity(0.1),
                ),
                child: const Icon(
                  Icons.person_outline,
                  size: 50,
                  color: Color(0xFF6C5CE7),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Không tìm thấy thông tin người dùng',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Vui lòng đăng nhập lại để xem thông tin tài khoản',
                style: TextStyle(fontSize: 14, color: Color(0xFF7F8C8D)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(
                    context,
                  ).pushNamedAndRemoveUntil('/login', (route) => false);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C5CE7),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Đăng nhập lại',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Scaffold(
          backgroundColor: themeProvider.backgroundColor,
          body: CustomScrollView(
            slivers: [
              // App Bar với gradient theo tier
              SliverAppBar(
                expandedHeight: 200,
                floating: false,
                pinned: true,
                backgroundColor: themeProvider.primaryColor,
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: BoxDecoration(gradient: themeProvider.gradient),
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              // Avatar và thông tin cơ bản - Layout ngang 2 cột
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Cột trái: Avatar + Nút NÂNG HẠNG
                                  Column(
                                    children: [
                                      // Avatar với shield icon
                                      Stack(
                                        children: [
                                          Container(
                                            width: 80,
                                            height: 80,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              gradient: const LinearGradient(
                                                begin: Alignment.topLeft,
                                                end: Alignment.bottomRight,
                                                colors: [
                                                  Colors.white,
                                                  Color(0xFFE5E7EB),
                                                ],
                                              ),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black
                                                      .withOpacity(0.1),
                                                  blurRadius: 10,
                                                  offset: const Offset(0, 5),
                                                ),
                                              ],
                                            ),
                                            child: Icon(
                                              Icons.person,
                                              size: 40,
                                              color: themeProvider.accentColor,
                                            ),
                                          ),
                                          // Shield icon overlay
                                          Positioned(
                                            top: 0,
                                            left: 0,
                                            child: Container(
                                              width: 24,
                                              height: 24,
                                              decoration: BoxDecoration(
                                                color:
                                                    themeProvider.accentColor,
                                                shape: BoxShape.circle,
                                                border: Border.all(
                                                  color: Colors.white,
                                                  width: 2,
                                                ),
                                              ),
                                              child: Icon(
                                                Icons.security,
                                                size: 12,
                                                color:
                                                    themeProvider.accentColor,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),

                                      // VIP Badge hoặc Upgrade button
                                      if (_canUpgradeTier())
                                        GestureDetector(
                                          onTap: _showTierUpgradeDialog,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 16,
                                              vertical: 8,
                                            ),
                                            decoration: BoxDecoration(
                                              gradient: themeProvider.gradient,
                                              borderRadius:
                                                  BorderRadius.circular(20),
                                              boxShadow: [
                                                BoxShadow(
                                                  color:
                                                      themeProvider.shadowColor,
                                                  blurRadius: 8,
                                                  offset: const Offset(0, 4),
                                                ),
                                              ],
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                // Crown icons
                                                Stack(
                                                  children: [
                                                    const Icon(
                                                      Icons.workspace_premium,
                                                      color: Color(
                                                        0xFF20B2AA,
                                                      ), // Teal
                                                      size: 20,
                                                    ),
                                                    Positioned(
                                                      left: 2,
                                                      top: 2,
                                                      child: Icon(
                                                        Icons.workspace_premium,
                                                        color: Colors.white
                                                            .withOpacity(0.8),
                                                        size: 16,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(width: 6),
                                                const Text(
                                                  'NÂNG HẠNG',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.bold,
                                                    letterSpacing: 1.0,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        )
                                      else
                                        // VIP Badge - hiển thị khi đã VIP
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            gradient: themeProvider.gradient,
                                            borderRadius: BorderRadius.circular(
                                              20,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color:
                                                    themeProvider.shadowColor,
                                                blurRadius: 8,
                                                offset: const Offset(0, 4),
                                              ),
                                            ],
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              // VIP Crown icon
                                              Stack(
                                                children: [
                                                  Icon(
                                                    Icons.workspace_premium,
                                                    color: themeProvider
                                                        .accentColor,
                                                    size: 20,
                                                  ),
                                                  Positioned(
                                                    left: 2,
                                                    top: 2,
                                                    child: Icon(
                                                      Icons.workspace_premium,
                                                      color: Colors.white
                                                          .withValues(
                                                            alpha: 0.8,
                                                          ),
                                                      size: 16,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(width: 6),
                                              const Text(
                                                'VIP MEMBER',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.bold,
                                                  letterSpacing: 1.0,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(width: 20),

                                  // Cột phải: Thông tin user + Status badges
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        // User info
                                        Text(
                                          '${_userData?['firstName'] ?? ''} ${_userData?['lastName'] ?? ''}',
                                          style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          _userData?['email'] ?? '',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            color: Colors.white70,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        // Status badges - nằm trên cùng một hàng như trong ảnh
                                        Row(
                                          children: [
                                            Expanded(
                                              child: _buildStatusBadge(
                                                'Email',
                                                _userData?['isEmailVerified'] ==
                                                        true
                                                    ? 'Đã xác thực'
                                                    : 'Chưa xác thực',
                                                _userData?['isEmailVerified'] ==
                                                        true
                                                    ? const Color(0xFF10B981)
                                                    : const Color(0xFFF59E0B),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: _buildStatusBadge(
                                                'KYC',
                                                _userData?['isKycVerified'] ==
                                                        true
                                                    ? 'Đã xác thực'
                                                    : 'Chưa xác thực',
                                                _userData?['isKycVerified'] ==
                                                        true
                                                    ? const Color(0xFF10B981)
                                                    : const Color(0xFFF59E0B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // Content
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    if (_userData?['isEmailVerified'] != true)
                      _buildEmailVerifyBanner(),
                    // Account Information Section
                    _buildSectionCard(
                      title: 'Thông tin tài khoản',
                      icon: Icons.account_circle,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 8,
                          ),
                          child: Consumer<ThemeProvider>(
                            builder: (context, themeProvider, child) {
                              return Table(
                                columnWidths: const {
                                  0: FixedColumnWidth(140), // Label column
                                  1: FlexColumnWidth(), // Value column
                                },
                                children: [
                                  _buildTableRow(
                                    'Họ và tên',
                                    '${_userData?['firstName'] ?? ''} ${_userData?['lastName'] ?? ''}',
                                  ),
                                  _buildEditableTableRow(
                                    'Email',
                                    _userData?['email'] ?? '',
                                    onEdit: _showChangeEmailDialog,
                                    themeProvider: themeProvider,
                                  ),
                                  _buildEditableTableRow(
                                    'Số điện thoại',
                                    _userData?['phone'] ?? 'Chưa cập nhật',
                                    onEdit: _showChangePhoneDialog,
                                    themeProvider: themeProvider,
                                  ),
                                  _buildTableRow(
                                    'Ngày tạo',
                                    _formatDate(_userData?['createdAt']),
                                  ),
                                  _buildTableRow(
                                    'Loại tài khoản',
                                    _getTierDisplayName(
                                      _userData?['accountTier'] ?? 'BASIC',
                                    ),
                                  ),
                                  _buildTableRow(
                                    'Trạng thái',
                                    _userData?['isActive'] == true
                                        ? 'Hoạt động'
                                        : 'Không hoạt động',
                                  ),
                                  _buildTableRow(
                                    'Ngày sinh',
                                    _formatDate(
                                      _getNested('dateOfBirth') ??
                                          _getNested(
                                            'userProfile',
                                            'dateOfBirth',
                                          ),
                                    ),
                                  ),
                                  _buildTableRow(
                                    'Mã số sinh viên',
                                    (_getNested('studentId') ??
                                            _getNested(
                                              'userProfile',
                                              'studentId',
                                            ) ??
                                            'N/A')
                                        .toString(),
                                  ),
                                  _buildTableRow(
                                    'Khóa',
                                    (_getNested('cohort') ??
                                            _getNested(
                                              'userProfile',
                                              'cohort',
                                            ) ??
                                            'N/A')
                                        .toString(),
                                  ),
                                  _buildTableRow(
                                    'Trường',
                                    (_getNested('school') ??
                                            _getNested(
                                              'userProfile',
                                              'school',
                                            ) ??
                                            'N/A')
                                        .toString(),
                                  ),
                                ],
                              );
                            },
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Security Section
                    _buildSectionCard(
                      title: 'Bảo mật',
                      icon: Icons.security,
                      children: [
                        _buildActionTile(
                          title: 'Đổi mật khẩu',
                          subtitle: 'Cập nhật mật khẩu của bạn',
                          icon: Icons.lock_outline,
                          onTap: _showChangePasswordDialog,
                        ),
                        _buildActionTile(
                          title: 'Xác thực 2FA',
                          subtitle: 'Bảo mật tài khoản với mã xác thực',
                          icon: Icons.phone_android,
                          onTap: _showTwoFADialog,
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Settings Section
                    _buildSectionCard(
                      title: 'Cài đặt',
                      icon: Icons.settings,
                      children: [
                        _buildActionTile(
                          title: 'Số tài khoản đẹp',
                          subtitle: 'Mua/đổi số tài khoản đẹp',
                          icon: Icons.stars_outlined,
                          onTap: _openVanity,
                        ),
                        _buildActionTile(
                          title: 'Thông báo',
                          subtitle: _notificationsEnabled
                              ? 'Đang bật'
                              : 'Đang tắt',
                          icon: Icons.notifications_outlined,
                          onTap: _showNotificationsDialog,
                        ),
                        _buildActionTile(
                          title: 'Ngôn ngữ',
                          subtitle: _language == 'vi'
                              ? 'Tiếng Việt'
                              : 'English',
                          icon: Icons.language,
                          onTap: _showLanguageDialog,
                        ),
                        _buildActionTile(
                          title: 'Chủ đề',
                          subtitle: _themeMode == 'light' ? 'Sáng' : 'Tối',
                          icon: Icons.palette_outlined,
                          onTap: _showThemeDialog,
                        ),
                        _buildActionTile(
                          title: 'KYC Storage',
                          subtitle: 'Xem thông tin lưu trữ KYC',
                          icon: Icons.storage_outlined,
                          onTap: () {
                            Navigator.pushNamed(context, '/kyc-storage-info');
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Support Section
                    _buildSectionCard(
                      title: 'Hỗ trợ',
                      icon: Icons.help_outline,
                      children: [
                        _buildActionTile(
                          title: 'Trung tâm trợ giúp',
                          subtitle: 'Câu hỏi thường gặp và hướng dẫn',
                          icon: Icons.help_outline,
                          onTap: () {
                            Navigator.pushNamed(context, '/help-center');
                          },
                        ),
                        _buildActionTile(
                          title: 'Liên hệ hỗ trợ',
                          subtitle: 'Liên hệ với đội ngũ hỗ trợ',
                          icon: Icons.contact_support_outlined,
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Tính năng đang phát triển'),
                                backgroundColor: const Color(0xFF2563EB),
                              ),
                            );
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Logout Button
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFE74C3C), Color(0xFFC0392B)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFE74C3C).withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: _logout,
                          borderRadius: BorderRadius.circular(16),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(
                              vertical: 16,
                              horizontal: 20,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.logout,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Đăng xuất',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),
                  ]),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String label, String status, Color color) {
    final bool isVerified = status.toLowerCase().contains('đã');
    final IconData categoryIcon = label.toLowerCase().contains('email')
        ? Icons.email_outlined
        : Icons.verified_user;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(categoryIcon, size: 14, color: color),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              status,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
          const SizedBox(width: 6),
          Icon(
            isVerified ? Icons.check_circle : Icons.error_outline,
            size: 14,
            color: color,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
    Widget? trailing,
  }) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Container(
          decoration: themeProvider.cardDecoration,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: themeProvider.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        icon,
                        color: themeProvider.primaryColor,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        title,
                        style: themeProvider.subheadingStyle.copyWith(
                          color: themeProvider.textPrimaryColor,
                        ),
                      ),
                    ),
                    if (trailing != null) trailing,
                  ],
                ),
              ),
              // Content
              ...children,
            ],
          ),
        );
      },
    );
  }

  TableRow _buildTableRow(String label, String value) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFFB0B0B0), // Light gray for labels
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFFFFFFFF), // Pure white for values
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  TableRow _buildEditableTableRow(
    String label,
    String value, {
    required VoidCallback onEdit,
    required ThemeProvider themeProvider,
  }) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFFB0B0B0), // Light gray for labels
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFFFFFFFF), // Pure white for values
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: onEdit,
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  width: 24,
                  height: 24,
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.edit_outlined,
                    size: 16,
                    color: themeProvider.accentColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140, // Tăng width để chứa "Mã số sinh viên" và căn chỉnh đều
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF7F8C8D),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 12), // Giảm khoảng cách để tiết kiệm không gian
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF2C3E50),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditableInfoRow(
    String label,
    String value, {
    required VoidCallback onEdit,
  }) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 140, // Cùng width với _buildInfoRow để căn chỉnh đều
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF7F8C8D),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(width: 12), // Cùng khoảng cách với _buildInfoRow
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF2C3E50),
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: onEdit,
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  width: 24,
                  height: 24,
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.edit_outlined,
                    color: themeProvider.accentColor,
                    size: 18,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActionTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: themeProvider.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      icon,
                      color: themeProvider.primaryColor,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: themeProvider.bodyStyle.copyWith(
                            fontWeight: FontWeight.w600,
                            color: themeProvider.textPrimaryColor,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(subtitle, style: themeProvider.captionStyle),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    color: themeProvider.textSecondaryColor,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  bool _canUpgradeTier() {
    final currentTier = _userData?['accountTier'] ?? 'BASIC';
    return currentTier != 'VIP';
  }

  void _showTierUpgradeDialog() {
    showDialog(
      context: context,
      builder: (context) =>
          _TierUpgradeDialog(currentTier: _userData?['accountTier'] ?? 'BASIC'),
    );
  }

  String _getTierDisplayName(String tier) {
    switch (tier.toUpperCase()) {
      case 'BASIC':
        return 'Cơ bản';
      case 'STANDARD':
        return 'Tiêu chuẩn';
      case 'PREMIUM':
        return 'Cao cấp';
      case 'VIP':
        return 'VIP';
      default:
        return 'Cơ bản';
    }
  }

  String _formatDate(dynamic dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString.toString());
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (e) {
      return 'N/A';
    }
  }
}

class _TierUpgradeDialog extends StatefulWidget {
  final String currentTier;

  const _TierUpgradeDialog({required this.currentTier});

  @override
  State<_TierUpgradeDialog> createState() => _TierUpgradeDialogState();
}

class _TierUpgradeDialogState extends State<_TierUpgradeDialog> {
  String? _selectedTier;
  bool _isLoading = false;
  Map<String, dynamic>? _requirements;

  @override
  void initState() {
    super.initState();
    _loadRequirements();
    print('🔍 Current tier from widget: ${widget.currentTier}');
  }

  Future<void> _loadRequirements() async {
    try {
      final requirements = await TierService.getTierRequirements();
      setState(() {
        _requirements = requirements;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể tải thông tin tier: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: themeProvider.primaryColor.withValues(alpha: 0.3),
              width: 2,
            ),
          ),
          backgroundColor: themeProvider.backgroundColor,
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: themeProvider.gradient,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.workspace_premium,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Nâng cấp tài khoản',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: themeProvider.textPrimaryColor,
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: 400,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chọn loại tài khoản muốn nâng cấp:',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: themeProvider.textPrimaryColor,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 20),

                if (_requirements != null) ...[
                  _buildTierOption(
                    'STANDARD',
                    'Tiêu chuẩn',
                    _requirements!['STANDARD'],
                    themeProvider,
                  ),
                  const SizedBox(height: 12),
                  _buildTierOption(
                    'PREMIUM',
                    'Cao cấp',
                    _requirements!['PREMIUM'],
                    themeProvider,
                  ),
                  const SizedBox(height: 12),
                  _buildTierOption(
                    'VIP',
                    'VIP',
                    _requirements!['VIP'],
                    themeProvider,
                  ),
                ] else ...[
                  Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        themeProvider.primaryColor,
                      ),
                    ),
                  ),
                ],

                if (_selectedTier != null && _requirements != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          themeProvider.primaryColor.withValues(alpha: 0.1),
                          themeProvider.secondaryColor.withValues(alpha: 0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: themeProvider.primaryColor.withValues(
                          alpha: 0.5,
                        ),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: themeProvider.shadowColor.withValues(
                            alpha: 0.2,
                          ),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                        BoxShadow(
                          color: themeProvider.primaryColor.withValues(
                            alpha: 0.1,
                          ),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: themeProvider.primaryColor,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Hạn mức ${_requirements![_selectedTier!]['name']}:',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: themeProvider.textPrimaryColor,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildLimitInfo(
                          'Giao dịch/ngày',
                          _requirements![_selectedTier!]['limits']['daily'],
                          themeProvider,
                        ),
                        _buildLimitInfo(
                          'Giao dịch/tháng',
                          _requirements![_selectedTier!]['limits']['monthly'],
                          themeProvider,
                        ),
                        _buildLimitInfo(
                          'ATM/ngày',
                          _requirements![_selectedTier!]['limits']['atmDaily'],
                          themeProvider,
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: themeProvider.primaryColor.withValues(
                          alpha: 0.3,
                        ),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: themeProvider.primaryColor.withValues(
                            alpha: 0.05,
                          ),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        backgroundColor: Colors.transparent,
                      ),
                      child: Text(
                        'Hủy',
                        style: TextStyle(
                          color: themeProvider.primaryColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _selectedTier != null && !_isLoading
                        ? _requestUpgrade
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedTier != null && !_isLoading
                          ? themeProvider.primaryColor
                          : themeProvider.textSecondaryColor.withValues(
                              alpha: 0.3,
                            ),
                      foregroundColor: _selectedTier != null && !_isLoading
                          ? Colors.white
                          : themeProvider.textSecondaryColor,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: _selectedTier != null && !_isLoading ? 4 : 0,
                      shadowColor: themeProvider.shadowColor,
                    ),
                    child: _isLoading
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text(
                            'Nâng cấp',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildTierOption(
    String tier,
    String name,
    Map<String, dynamic> tierData,
    ThemeProvider themeProvider,
  ) {
    final isSelected = _selectedTier == tier;
    final isDisabled = _isTierDisabled(tier);

    return GestureDetector(
      onTap: isDisabled ? null : () => setState(() => _selectedTier = tier),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: isSelected
              ? LinearGradient(
                  colors: [
                    themeProvider.primaryColor.withValues(alpha: 0.1),
                    themeProvider.secondaryColor.withValues(alpha: 0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isDisabled
              ? themeProvider.backgroundColor.withValues(alpha: 0.3)
              : isSelected
              ? null
              : themeProvider.backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDisabled
                ? themeProvider.textSecondaryColor.withValues(alpha: 0.3)
                : isSelected
                ? themeProvider.primaryColor
                : themeProvider.primaryColor.withValues(alpha: 0.2),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: themeProvider.shadowColor.withValues(alpha: 0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: themeProvider.primaryColor.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [
                  BoxShadow(
                    color: themeProvider.primaryColor.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
        ),
        child: Row(
          children: [
            Radio<String>(
              value: tier,
              groupValue: _selectedTier,
              onChanged: isDisabled
                  ? null
                  : (value) => setState(() => _selectedTier = value),
              activeColor: themeProvider.primaryColor,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: isDisabled
                              ? themeProvider.textSecondaryColor.withValues(
                                  alpha: 0.5,
                                )
                              : isSelected
                              ? themeProvider.textPrimaryColor
                              : themeProvider.textPrimaryColor,
                        ),
                      ),
                      if (isDisabled) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFFEF4444,
                            ).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: const Color(
                                0xFFEF4444,
                              ).withValues(alpha: 0.3),
                            ),
                          ),
                          child: const Text(
                            'Hiện tại',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Hạn mức: ${_formatCurrency(tierData['limits']['daily'])}/ngày',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDisabled
                          ? themeProvider.textSecondaryColor.withValues(
                              alpha: 0.5,
                            )
                          : isSelected
                          ? themeProvider.textSecondaryColor
                          : themeProvider.textSecondaryColor,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: themeProvider.primaryColor,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  bool _isTierDisabled(String tier) {
    final currentTier = widget.currentTier;

    // Tier hierarchy: BASIC < STANDARD < PREMIUM < VIP
    final tierLevels = {'BASIC': 0, 'STANDARD': 1, 'PREMIUM': 2, 'VIP': 3};

    final currentLevel = tierLevels[currentTier] ?? 0;
    final targetLevel = tierLevels[tier] ?? 0;

    final isDisabled = currentLevel >= targetLevel;
    print(
      '🔍 Tier $tier disabled: $isDisabled (current: $currentTier, level: $currentLevel, target: $targetLevel)',
    );

    // Disable if current tier is higher than or equal to target tier
    return isDisabled;
  }

  Widget _buildLimitInfo(
    String label,
    int amount,
    ThemeProvider themeProvider,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: themeProvider.textSecondaryColor,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            _formatCurrency(amount),
            style: TextStyle(
              color: themeProvider.textPrimaryColor,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _formatCurrency(int amount) {
    if (amount >= 1000000000) {
      return '${(amount / 1000000000).toStringAsFixed(1)}B VND';
    } else if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(0)}M VND';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}K VND';
    }
    return '$amount VND';
  }

  Future<void> _requestUpgrade() async {
    if (_selectedTier == null) return;

    setState(() => _isLoading = true);

    try {
      final result = await TierService.requestTierUpgrade(_selectedTier!);

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message'] ?? 'Đã gửi yêu cầu nâng cấp thành công',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gửi yêu cầu nâng cấp thất bại: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
