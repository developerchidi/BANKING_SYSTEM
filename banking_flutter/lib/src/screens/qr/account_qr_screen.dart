import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ionicons/ionicons.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/account.dart';
import '../../services/qr_save_service.dart';
import '../../theme/theme_provider.dart';
import '../../theme/fintech_theme.dart';

class AccountQRScreen extends StatefulWidget {
  final Account account;

  const AccountQRScreen({super.key, required this.account});

  @override
  State<AccountQRScreen> createState() => _AccountQRScreenState();
}

class _AccountQRScreenState extends State<AccountQRScreen> {
  bool _isLoading = true;
  String? _qrData;

  @override
  void initState() {
    super.initState();
    _generateQRData();
    _updateThemeFromUserData();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Update theme provider when screen becomes active
    _updateThemeFromUserData();
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
              '🎨 QR: Updated theme provider with tier: ${userData['accountTier']}',
            );
          }
        } catch (e) {
          print('🎨 QR: Error updating theme: $e');
        }
      }
    } catch (e) {
      print('🎨 QR: Error reading user data for theme: $e');
    }
  }

  void _generateQRData() {
    // Create QR data with account information
    final qrData = {
      'type': 'banking_transfer',
      'accountNumber': widget.account.accountNumber,
      'accountName': widget.account.accountName,
      'bankName': 'Chidi Bank',
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };

    setState(() {
      _qrData = jsonEncode(qrData);
      _isLoading = false;
    });
  }

  void _copyAccountNumber() {
    Clipboard.setData(ClipboardData(text: widget.account.accountNumber));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Đã sao chép số tài khoản'),
        backgroundColor: const Color(0xFF6366F1),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  void _shareQR() {
    // TODO: Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Chức năng chia sẻ sẽ được cập nhật'),
        backgroundColor: Color(0xFF6366F1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _saveQRToGallery() async {
    try {
      // Kiểm tra quyền truy cập thư viện ảnh trước
      final hasPermission = await _checkAndRequestPermission();
      if (!hasPermission) {
        return;
      }

      // Hiển thị loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
          ),
        ),
      );

      // Lấy user tier từ ThemeProvider
      final themeProvider = Provider.of<ThemeProvider>(context, listen: false);
      final userTier = themeProvider.userTier;

      // Lưu QR vào thư viện ảnh
      final success = await QRSaveService.saveQRToGallery(
        qrData: _qrData!,
        accountNumber: widget.account.accountNumber,
        accountName: widget.account.accountName,
        userTier: userTier,
      );

      // Đóng loading dialog
      if (mounted) Navigator.pop(context);

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Đã lưu QR code vào thư viện ảnh'),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            action: SnackBarAction(
              label: 'Mở',
              textColor: Colors.white,
              onPressed: () {
                // TODO: Mở thư viện ảnh
              },
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Không thể lưu QR code. Vui lòng kiểm tra quyền truy cập',
            ),
            backgroundColor: Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      // Đóng loading dialog nếu có lỗi
      if (mounted) Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi khi lưu QR code: $e'),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<bool> _checkAndRequestPermission() async {
    // Kiểm tra quyền hiện tại
    final status = await Permission.photos.status;

    if (status.isGranted) {
      return true;
    }

    // Nếu bị từ chối vĩnh viễn, hiển thị dialog hướng dẫn
    if (status.isPermanentlyDenied) {
      return await _showPermissionDeniedDialog();
    }

    // Yêu cầu quyền
    final result = await Permission.photos.request();

    if (result.isGranted) {
      return true;
    }

    // Nếu vẫn bị từ chối, hiển thị dialog hướng dẫn
    if (result.isPermanentlyDenied) {
      return await _showPermissionDeniedDialog();
    }

    // Từ chối tạm thời
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Cần quyền truy cập thư viện ảnh để lưu QR code'),
        backgroundColor: Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
      ),
    );
    return false;
  }

  Future<bool> _showPermissionDeniedDialog() async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFEF4444),
                  size: 24,
                ),
                SizedBox(width: 12),
                Text(
                  'Quyền truy cập bị từ chối',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ],
            ),
            content: const Text(
              'Để lưu QR code vào thư viện ảnh, bạn cần cấp quyền truy cập thư viện ảnh.\n\n'
              'Vui lòng vào Cài đặt > Quyền ứng dụng > Chidi Bank > Thư viện ảnh và bật quyền.',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF6B7280),
                height: 1.5,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text(
                  'Hủy',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(context, false);
                  await openAppSettings();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Mở cài đặt',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 400;
    final padding = isSmall ? 16.0 : 20.0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'QR Code Tài Khoản',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: const Color(0xFF6366F1),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            onPressed: _shareQR,
            icon: const Icon(Ionicons.share_outline),
            tooltip: 'Chia sẻ',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
              ),
            )
          : SingleChildScrollView(
              padding: EdgeInsets.all(padding),
              child: Column(
                children: [
                  const SizedBox(height: 20),

                  // Account Info Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Icon(
                          Ionicons.card_outline,
                          color: Colors.white,
                          size: 32,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          widget.account.accountName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.account.accountNumber,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            widget.account.accountType,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  // QR Code Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Quét mã QR để chuyển tiền',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF2C3E50),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Người khác có thể quét mã này để chuyển tiền vào tài khoản của bạn',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF6B7280),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),

                        // QR Code
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFFE5E7EB),
                              width: 1,
                            ),
                          ),
                          child: QrImageView(
                            data: _qrData!,
                            version: QrVersions.auto,
                            size: 200.0,
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF2C3E50),
                            errorStateBuilder: (context, error) {
                              return const Center(
                                child: Text(
                                  'Lỗi tạo QR code',
                                  style: TextStyle(color: Colors.red),
                                ),
                              );
                            },
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Action Buttons
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _copyAccountNumber,
                                icon: const Icon(Ionicons.copy_outline),
                                label: const Text('Sao chép số TK'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF6366F1),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _shareQR,
                                icon: const Icon(Ionicons.share_outline),
                                label: const Text('Chia sẻ'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF6366F1),
                                  side: const BorderSide(
                                    color: Color(0xFF6366F1),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _saveQRToGallery,
                            icon: const Icon(Ionicons.download_outline),
                            label: const Text('Lưu QR vào thư viện ảnh'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Instructions
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F9FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF3B82F6).withValues(alpha: 0.2),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Ionicons.information_circle_outline,
                              color: Color(0xFF3B82F6),
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Hướng dẫn sử dụng',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF3B82F6),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          '• Người khác có thể quét mã QR này để chuyển tiền vào tài khoản của bạn\n'
                          '• Mã QR chứa thông tin tài khoản và sẽ tự động điền vào form chuyển khoản\n'
                          '• Đảm bảo màn hình đủ sáng khi cho người khác quét',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF1E40AF),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }
}
