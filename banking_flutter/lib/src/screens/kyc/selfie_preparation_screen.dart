import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import 'selfie_capture_screen.dart';

class SelfiePreparationScreen extends StatefulWidget {
  final Function(File) onVideoCaptured;
  
  const SelfiePreparationScreen({
    super.key,
    required this.onVideoCaptured,
  });

  @override
  State<SelfiePreparationScreen> createState() => _SelfiePreparationScreenState();
}

class _SelfiePreparationScreenState extends State<SelfiePreparationScreen>
    with TickerProviderStateMixin {
  bool _isCheckingPermissions = false;
  bool _permissionsGranted = false;
  String _statusText = 'Chuẩn bị quay video selfie';
  
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.3, 1.0, curve: Curves.easeOut),
    ));
    
    _animationController.forward();
    _checkPermissions();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _checkPermissions() async {
    setState(() {
      _isCheckingPermissions = true;
      _statusText = 'Đang kiểm tra quyền truy cập...';
    });

    try {
      // Check camera permission
      final cameraStatus = await Permission.camera.status;
      final micStatus = await Permission.microphone.status;
      
      if (cameraStatus.isGranted && micStatus.isGranted) {
        setState(() {
          _permissionsGranted = true;
          _statusText = 'Đã có đầy đủ quyền truy cập. Sẵn sàng quay video!';
        });
      } else {
        setState(() {
          _permissionsGranted = false;
          _statusText = 'Cần cấp quyền camera và microphone để quay video';
        });
      }
    } catch (e) {
      setState(() {
        _permissionsGranted = false;
        _statusText = 'Lỗi kiểm tra quyền: $e';
      });
    } finally {
      setState(() {
        _isCheckingPermissions = false;
      });
    }
  }

  Future<void> _requestPermissions() async {
    setState(() {
      _isCheckingPermissions = true;
      _statusText = 'Đang yêu cầu quyền truy cập...';
    });

    try {
      // Request both permissions
      final Map<Permission, PermissionStatus> statuses = await [
        Permission.camera,
        Permission.microphone,
      ].request();

      final cameraGranted = statuses[Permission.camera]?.isGranted ?? false;
      final micGranted = statuses[Permission.microphone]?.isGranted ?? false;

      if (cameraGranted && micGranted) {
        setState(() {
          _permissionsGranted = true;
          _statusText = 'Đã cấp quyền thành công. Sẵn sàng quay video!';
        });
      } else {
        setState(() {
          _permissionsGranted = false;
          _statusText = 'Cần cấp quyền camera và microphone để tiếp tục';
        });
        
        // Show dialog to open settings if permissions denied
        if (!cameraGranted || !micGranted) {
          _showPermissionDialog();
        }
      }
    } catch (e) {
      setState(() {
        _permissionsGranted = false;
        _statusText = 'Lỗi yêu cầu quyền: $e';
      });
    } finally {
      setState(() {
        _isCheckingPermissions = false;
      });
    }
  }

  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: Color(0xFFE67E22),
                size: 28,
              ),
              SizedBox(width: 12),
              Text(
                'Cần quyền truy cập',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: const Text(
            'Để quay video selfie, ứng dụng cần quyền truy cập camera và microphone. Vui lòng cấp quyền trong cài đặt.',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Hủy',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                openAppSettings();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Mở cài đặt'),
            ),
          ],
        );
      },
    );
  }

  void _startSelfieCapture() {
    if (!_permissionsGranted) {
      _requestPermissions();
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SelfieCaptureScreen(
          onVideoCaptured: widget.onVideoCaptured,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: Column(
          children: [
            // Main Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 12),
                    
                    // Main Content
                    AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _scaleAnimation.value,
                          child: FadeTransition(
                            opacity: _fadeAnimation,
                            child: Column(
                              children: [
                                // Selfie Icon
                                Container(
                                  width: 96,
                                  height: 96,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: const LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        Color(0xFF27AE60),
                                        Color(0xFF2ECC71),
                                      ],
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF27AE60).withOpacity(0.3),
                                        blurRadius: 20,
                                        offset: const Offset(0, 10),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.face,
                                    size: 48,
                                    color: Colors.white,
                                  ),
                                ),
                                
                                const SizedBox(height: 20),
                                
                                // Title
                                const Text(
                                  'Chuẩn bị quay video selfie',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 8),
                                
                                // Subtitle
                                Text(
                                  'Chúng tôi sẽ quay một video ngắn để xác thực danh tính của bạn',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.white70,
                                    height: 1.5,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 20),
                    
                    // Status Card (glassmorphism)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.08),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.25),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Icon(
                            _isCheckingPermissions 
                                ? Icons.hourglass_empty
                                : _permissionsGranted 
                                    ? Icons.check_circle
                                    : Icons.warning_amber_rounded,
                            color: _isCheckingPermissions 
                                ? Colors.white70
                                : _permissionsGranted 
                                    ? const Color(0xFF2ECC71)
                                    : const Color(0xFFFFC107),
                            size: 32,
                          ),
                          const SizedBox(height: 12),
                          
                          Text(
                            _statusText,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: _isCheckingPermissions 
                                  ? Colors.white70
                                  : _permissionsGranted 
                                      ? const Color(0xFF2ECC71)
                                      : const Color(0xFFFFC107),
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Instructions Card (glassmorphism)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.25),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2563EB).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(
                              Icons.info_outline,
                              color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Text(
                                'Hướng dẫn quay video selfie',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          
                          _buildInstructionItem(
                            '1',
                            'Đặt khuôn mặt vào khung bầu dục cố định',
                            Icons.face,
                          ),
                          _buildInstructionItem(
                            '2',
                            'Điều chỉnh vị trí để căn giữa khuôn mặt',
                            Icons.center_focus_strong,
                          ),
                          _buildInstructionItem(
                            '3',
                            'Video sẽ tự động quay 3 giây',
                            Icons.videocam,
                          ),
                          _buildInstructionItem(
                            '4',
                            'Giữ nguyên vị trí trong khi quay',
                            Icons.pause_circle_outline,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isCheckingPermissions ? null : _startSelfieCapture,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7C3AED),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                        child: Text(
                          _permissionsGranted ? 'Bắt đầu quay video' : 'Cấp quyền và bắt đầu',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
            
            // No inner bottom buttons; parent screen controls actions
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionItem(String number, String text, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Icon(
            icon,
            color: Colors.white,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}