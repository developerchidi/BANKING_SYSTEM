import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../config/api_config.dart';
import '../../services/http_client.dart';
import '../../services/auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import 'cccd_scanner_screen.dart';
import 'selfie_preparation_screen.dart';
import 'kyc_success_screen.dart';
import '../../services/image_storage_service.dart';

class KYCCaptureScreen extends StatefulWidget {
  final Map<String, dynamic> registrationData;
  final String documentType; // 'cccd' or 'student_card'

  const KYCCaptureScreen({
    super.key,
    required this.registrationData,
    this.documentType = 'student_card', // Default to student card
  });

  @override
  State<KYCCaptureScreen> createState() => _KYCCaptureScreenState();
}

class _KYCCaptureScreenState extends State<KYCCaptureScreen> {
  int _currentStep = 0;
  File? _frontImage;
  File? _backImage;
  File? _selfieVideo;
  Map<String, dynamic>? _extractedData;
  Map<String, dynamic>? _frontData;
  Map<String, dynamic>? _backData;
  bool _isProcessing = false;

  List<Map<String, dynamic>> get _steps {
    return [
      {
        'title': 'Quét thẻ sinh viên',
        'subtitle': 'Đặt thẻ sinh viên trong khung và quét',
        'icon': Icons.school,
        'color': const Color(0xFF2563EB),
      },
      {
        'title': 'Chụp ảnh selfie',
        'subtitle': 'Chụp ảnh selfie để xác thực danh tính',
        'icon': Icons.face,
        'color': const Color(0xFF27AE60),
      },
      {
        'title': 'Xác nhận thông tin',
        'subtitle': 'Kiểm tra và xác nhận thông tin đã trích xuất',
        'icon': Icons.check_circle,
        'color': const Color(0xFFA855F7),
      },
    ];
  }

  @override
  void initState() {
    super.initState();
    _checkTokenStatus();
  }

  Future<void> _checkTokenStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    print(
      '🔐 KYC Capture: Screen loaded - Token found: ${token != null ? 'Yes' : 'No'}',
    );
    print('🔐 KYC Capture: Token length: ${token?.length ?? 0}');
    if (token != null) {
      print('🔐 KYC Capture: Token preview: ${token.substring(0, 20)}...');
    } else {
      print(
        '🔐 KYC Capture: No token found, attempting auto-login with registration data',
      );
      await _attemptAutoLogin();
    }
  }

  Future<void> _attemptAutoLogin() async {
    try {
      final email = widget.registrationData['email'] as String? ?? '';
      final password = widget.registrationData['password'] as String? ?? '';

      if (email.isNotEmpty && password.isNotEmpty) {
        print('🔐 KYC Capture: Attempting auto-login with email: $email');
        final authService = AuthService(ApiClient());
        await authService.login(email, password);

        // Check if token was saved
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('accessToken');
        print(
          '🔐 KYC Capture: Auto-login result - Token saved: ${token != null ? 'Yes' : 'No'}',
        );
        if (token != null) {
          print(
            '🔐 KYC Capture: Token length after auto-login: ${token.length}',
          );
        }
      } else {
        print(
          '🔐 KYC Capture: No email/password in registration data for auto-login',
        );
      }
    } catch (e) {
      print('🔐 KYC Capture: Auto-login failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F23),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F0F23), Color(0xFF1A1A2E), Color(0xFF16213E)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom App Bar
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Header
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(
                                                alpha:0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_new,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Xác thực danh tính',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Bước ${_currentStep + 1}/${_steps.length}',
                                style: TextStyle(
                                  color: Colors.white.withValues(
                                                alpha:0.7),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFA855F7).withValues(
                                                alpha:0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFA855F7).withValues(
                                                alpha:0.3),
                            ),
                          ),
                          child: Text(
                            '${((_currentStep + 1) / _steps.length * 100).round()}%',
                            style: const TextStyle(
                              color: Color(0xFFA855F7),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Progress Bar
                    Container(
                      height: 6,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(
                                                alpha:0.1),
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: (_currentStep + 1) / _steps.length,
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFA855F7), Color(0xFF7C3AED)],
                            ),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: _buildStepContent(),
                ),
              ),

              // Navigation Buttons
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(
                                                alpha:0.05),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(30),
                    topRight: Radius.circular(30),
                  ),
                  border: Border.all(color: Colors.white.withValues(
                                                alpha:0.1)),
                ),
                child: Row(
                  children: [
                    if (_currentStep > 0)
                      Expanded(
                        child: Container(
                          height: 56,
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFFA855F7)),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: OutlinedButton(
                            onPressed: _previousStep,
                            style: OutlinedButton.styleFrom(
                              side: BorderSide.none,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text(
                              'Quay lại',
                              style: TextStyle(
                                color: Color(0xFFA855F7),
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (_currentStep > 0) const SizedBox(width: 16),
                    Expanded(
                      flex: 2,
                      child: Container(
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFA855F7), Color(0xFF7C3AED)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFA855F7).withValues(
                                                alpha:0.3),
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: _canProceed() ? _nextStep : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: _isProcessing
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white,
                                    ),
                                  ),
                                )
                              : Text(
                                  _currentStep == _steps.length - 1
                                      ? 'Hoàn thành'
                                      : 'Tiếp tục',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildCCCDCaptureStep('front');
      case 1:
        return SelfiePreparationScreen(
          onVideoCaptured: (File video) async {
            setState(() => _selfieVideo = video);

            // Save selfie video to permanent storage
            try {
              final userId =
                  widget.registrationData['email'] as String? ?? 'unknown';
              print(
                '🔐 Selfie Video: Attempting to save video for user: $userId',
              );
              print('🔐 Selfie Video: Video path: ${video.path}');
              print('🔐 Selfie Video: Video exists: ${await video.exists()}');

              final savedPath = await ImageStorageService.saveSelfieImage(
                userId: userId,
                imageFile:
                    video, // Video file can be treated as image file for storage
              );

              print('🔐 Selfie Video: Saved successfully to: $savedPath');

              // Update the video path to the saved path
              setState(() => _selfieVideo = File(savedPath));

              // Auto proceed to next step after saving
              Future.delayed(const Duration(milliseconds: 500), () {
                if (mounted) {
                  _nextStep();
                }
              });
            } catch (e) {
              print('🔐 Selfie Video: Error saving video: $e');
              // Continue with original video path if saving fails
            }
          },
        );
      case 2:
        return _buildConfirmationStep();
      default:
        return const SizedBox();
    }
  }

  Widget _buildCCCDCaptureStep(String documentType) {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Step Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFA855F7).withValues(
                                                alpha:0.1),
                  const Color(0xFF7C3AED).withValues(
                                                alpha:0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFFA855F7).withValues(
                                                alpha:0.3),
              ),
            ),
            child: Column(
              children: [
                // Icon with animation
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFA855F7), Color(0xFF7C3AED)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFA855F7).withValues(
                                                alpha:0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Icon(
                    documentType == 'front'
                        ? Icons.credit_card
                        : Icons.credit_card,
                    size: 50,
                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 20),

                Text(
                  'Quét thẻ sinh viên',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 8),

                Text(
                  'Đặt thẻ sinh viên vào khung và quét để trích xuất thông tin',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(
                                                alpha:0.7),
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 24),

                // Capture Button
                Container(
                  width: double.infinity,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFA855F7), Color(0xFF7C3AED)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFA855F7).withValues(
                                                alpha:0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: ElevatedButton.icon(
                    onPressed: () => _openCCCDScanner(documentType),
                    icon: const Icon(Icons.qr_code_scanner, size: 24),
                    label: Text(
                      'Quét thẻ sinh viên',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Preview captured data
          if (documentType == 'front' && _frontData != null)
            _buildDataPreview('Thông tin mặt trước', _frontData!)
          else if (documentType == 'back' && _backData != null)
            _buildDataPreview('Thông tin mặt sau', _backData!),
        ],
      ),
    );
  }

  Widget _buildDataPreview(String title, Map<String, dynamic> data) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF27AE60).withValues(
                                                alpha:0.1),
            const Color(0xFF2ECC71).withValues(
                                                alpha:0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF27AE60).withValues(
                                                alpha:0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF27AE60),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF27AE60),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...data.entries
              .map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 100,
                        child: Text(
                          _getFieldLabel(entry.key),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withValues(
                                                alpha:0.7),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          entry.value.toString(),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ],
      ),
    );
  }

  String _getFieldLabel(String key) {
    switch (key) {
      case 'studentId':
        return 'MSSV:';
      case 'fullName':
        return 'Họ tên:';
      case 'dateOfBirth':
        return 'Ngày sinh:';
      case 'university':
        return 'Trường:';
      case 'academicYear':
        return 'Khóa:';
      case 'cardType':
        return 'Loại thẻ:';
      default:
        return '$key:';
    }
  }

  void _openCCCDScanner(String documentType) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CCCDScannerScreen(
          documentType: documentType,
          documentCategory: 'student_card',
          onDataExtracted: (data) async {
            setState(() {
              if (documentType == 'front') {
                _frontData = data;
                // Use actual image path from OCR result
                if (data.containsKey('imagePath')) {
                  _frontImage = File(data['imagePath']);
                } else {
                  _frontImage = File('dummy_path'); // Fallback
                }
              } else {
                _backData = data;
                if (data.containsKey('imagePath')) {
                  _backImage = File(data['imagePath']);
                } else {
                  _backImage = File('dummy_path'); // Fallback
                }
              }
            });

            // Save image to permanent storage
            if (data.containsKey('imagePath') && _frontImage != null) {
              try {
                final userId =
                    widget.registrationData['email'] as String? ?? 'unknown';
                final savedPath =
                    await ImageStorageService.saveStudentCardImage(
                      userId: userId,
                      imageFile: _frontImage!,
                    );

                // Update the data with permanent path
                setState(() {
                  if (documentType == 'front') {
                    _frontData!['permanentImagePath'] = savedPath;
                  } else {
                    _backData!['permanentImagePath'] = savedPath;
                  }
                });

                print('Student card image saved to: $savedPath');
              } catch (e) {
                print('Error saving student card image: $e');
              }
            }
          },
        ),
      ),
    );
  }

  Widget _buildConfirmationStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Success Header (full width like extracted info box)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF27AE60).withValues(
                                                alpha:0.1),
                  const Color(0xFF2ECC71).withValues(
                                                alpha:0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFF27AE60).withValues(
                                                alpha:0.3),
              ),
            ),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF27AE60), Color(0xFF2ECC71)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF27AE60).withValues(
                                                alpha:0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Xác thực hoàn tất!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tất cả thông tin đã được trích xuất thành công',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(
                                                alpha:0.7),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Document Status
          Row(
            children: [
              Expanded(
                child: _buildStatusCard(
                  'Thẻ sinh viên',
                  _frontData != null,
                  Icons.school,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatusCard(
                  'Selfie Video',
                  _selfieVideo != null,
                  Icons.videocam,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Extracted Information
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withValues(
                                                alpha:0.1),
                  Colors.white.withValues(
                                                alpha:0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(
                                                alpha:0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFA855F7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.person,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Thông tin đã trích xuất',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Student Card Image Preview
                if (_frontImage != null &&
                    _frontImage!.path != 'dummy_path') ...[
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFFA855F7).withValues(
                                                alpha:0.3),
                        width: 2,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.file(
                        _frontImage!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey.withValues(
                                                alpha:0.3),
                            child: const Center(
                              child: Icon(
                                Icons.image_not_supported,
                                color: Colors.white54,
                                size: 48,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                if (_frontData != null) ...[
                  _buildInfoRow('MSSV', _frontData!['studentId'] ?? 'N/A'),
                  _buildInfoRow('Họ tên', _frontData!['fullName'] ?? 'N/A'),
                  _buildInfoRow(
                    'Ngày sinh',
                    _frontData!['dateOfBirth'] ?? 'N/A',
                  ),
                  _buildInfoRow('Trường', _frontData!['university'] ?? 'N/A'),
                  _buildInfoRow('Khóa', _frontData!['academicYear'] ?? 'N/A'),
                ] else ...[
                  Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 48,
                          color: Colors.white.withValues(
                                                alpha:0.5),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Đang xử lý thông tin...',
                          style: TextStyle(
                            color: Colors.white.withValues(
                                                alpha:0.7),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Registration Data Summary
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFA855F7).withValues(
                                                alpha:0.1),
                  const Color(0xFF7C3AED).withValues(
                                                alpha:0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFFA855F7).withValues(
                                                alpha:0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFA855F7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.videocam,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Thông tin video selfie',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFA855F7),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  'Trạng thái',
                  _selfieVideo != null ? 'Đã quay video' : 'Chưa quay video',
                ),
                _buildInfoRow(
                  'Đường dẫn file',
                  _selfieVideo?.path ?? 'Chưa có file',
                ),
                _buildInfoRow(
                  'Kích thước file',
                  _selfieVideo != null
                      ? '${(_selfieVideo!.lengthSync() / 1024 / 1024).toStringAsFixed(2)} MB'
                      : 'Chưa có file',
                ),
                _buildInfoRow(
                  'Thời gian tạo',
                  _selfieVideo != null
                      ? _selfieVideo!.lastModifiedSync().toString().substring(
                          0,
                          19,
                        )
                      : 'Chưa có file',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(String title, bool isCompleted, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isCompleted
              ? [
                  const Color(0xFF27AE60).withValues(
                                                alpha:0.1),
                  const Color(0xFF2ECC71).withValues(
                                                alpha:0.05),
                ]
              : [
                  Colors.white.withValues(
                                                alpha:0.05),
                  Colors.white.withValues(
                                                alpha:0.02),
                ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCompleted
              ? const Color(0xFF27AE60).withValues(
                                                alpha:0.3)
              : Colors.white.withValues(
                                                alpha:0.1),
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isCompleted
                  ? const Color(0xFF27AE60)
                  : Colors.white.withValues(
                                                alpha:0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCompleted ? Icons.check : icon,
              color: isCompleted ? Colors.white : Colors.white.withValues(
                                                alpha:0.5),
              size: 20,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: isCompleted
                  ? const Color(0xFF27AE60)
                  : Colors.white.withValues(
                                                alpha:0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreview(String title, File? image) {
    return Column(
      children: [
        Container(
          height: 80,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: image != null
                  ? const Color(0xFF27AE60)
                  : const Color(0xFFE9ECEF),
            ),
          ),
          child: image != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(image, fit: BoxFit.cover),
                )
              : const Center(
                  child: Icon(Icons.image, color: Color(0xFFBDC3C7), size: 32),
                ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Color(0xFF7F8C8D),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(
                                                alpha:0.7),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _canProceed() {
    switch (_currentStep) {
      case 0:
        return _frontData != null;
      case 1:
        return _selfieVideo != null;
      case 2:
        return _frontData != null;
      default:
        return false;
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  void _nextStep() async {
    if (_currentStep < _steps.length - 1) {
      setState(() => _currentStep++);
    } else {
      // Complete registration
      await _completeRegistration();
    }
  }

  Future<void> _completeRegistration() async {
    setState(() => _isProcessing = true);

    try {
      // Debug KYC data before submission
      print('🔐 KYC Submit: Document Type: STUDENT_CARD');
      print('🔐 KYC Submit: Front Image Path: ${_frontImage?.path}');
      print('🔐 KYC Submit: Selfie Video Path: ${_selfieVideo?.path}');
      print('🔐 KYC Submit: Extracted Data: ${jsonEncode(_frontData)}');

      // Build multipart request to submit KYC
      if (_frontData == null || _frontImage == null || _selfieVideo == null) {
        throw Exception(
          'Thiếu dữ liệu KYC - Front: ${_frontData != null}, Image: ${_frontImage != null}, Video: ${_selfieVideo != null}',
        );
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/kyc/submit');
      final request = http.MultipartRequest('POST', uri);

      // Headers with auth token (let MultipartRequest set its own Content-Type with boundary)
      final prefs = await SharedPreferences.getInstance();
      var token = prefs.getString('accessToken');
      final refreshToken = prefs.getString('refreshToken');
      print('🔐 KYC Submit: Token found: ${token != null ? 'Yes' : 'No'}');
      print('🔐 KYC Submit: Token length: ${token?.length ?? 0}');
      print(
        '🔐 KYC Submit: Refresh token found: ${refreshToken != null ? 'Yes' : 'No'}',
      );
      print(
        '🔐 KYC Submit: Refresh token length: ${refreshToken?.length ?? 0}',
      );

      // If no token found, attempt auto-login before proceeding
      if (token == null || token.isEmpty) {
        print('🔐 KYC Submit: No token found, attempting emergency auto-login');
        try {
          final email = widget.registrationData['email'] as String? ?? '';
          final password = widget.registrationData['password'] as String? ?? '';

          if (email.isNotEmpty && password.isNotEmpty) {
            print('🔐 KYC Submit: Emergency auto-login with email: $email');
            final authService = AuthService(ApiClient());
            await authService.login(email, password);

            // Re-check token after login
            token = prefs.getString('accessToken');
            print(
              '🔐 KYC Submit: Emergency auto-login result - Token found: ${token != null ? 'Yes' : 'No'}',
            );
            if (token != null) {
              print('🔐 KYC Submit: Emergency token length: ${token.length}');
            }
          } else {
            print(
              '🔐 KYC Submit: No email/password available for emergency auto-login',
            );
          }
        } catch (e) {
          print('🔐 KYC Submit: Emergency auto-login failed: $e');
        }
      } else {
        // Token exists, but might be expired - test validity first
        print('🔐 KYC Submit: Token exists, testing validity...');
        try {
          final authService = AuthService(ApiClient());
          final isValid = await authService.testTokenValidity();

          if (!isValid) {
            print('🔐 KYC Submit: Token is invalid, attempting refresh...');

            // Check if refresh token is available
            final refreshToken = prefs.getString('refreshToken');
            if (refreshToken != null && refreshToken.isNotEmpty) {
              await authService.refreshTokenIfNeeded();
            } else {
              print(
                '🔐 KYC Submit: No refresh token, attempting emergency re-login...',
              );
              // Force re-login with registration data
              try {
                final email = widget.registrationData['email'] as String? ?? '';
                final password =
                    widget.registrationData['password'] as String? ?? '';

                if (email.isNotEmpty && password.isNotEmpty) {
                  print('🔐 KYC Submit: Emergency re-login with email: $email');
                  await authService.login(email, password);

                  // Re-check token after re-login
                  token = prefs.getString('accessToken');
                  print(
                    '🔐 KYC Submit: After emergency re-login - Token found: ${token != null ? 'Yes' : 'No'}',
                  );
                }
              } catch (e) {
                print('🔐 KYC Submit: Emergency re-login failed: $e');
              }
            }

            // Re-check token after refresh/re-login attempt
            token = prefs.getString('accessToken');
            print(
              '🔐 KYC Submit: After refresh/re-login attempt - Token found: ${token != null ? 'Yes' : 'No'}',
            );
          } else {
            print('🔐 KYC Submit: Token is valid, proceeding with submission');
          }
        } catch (e) {
          print('🔐 KYC Submit: Token validation/refresh failed: $e');
          // Continue with existing token, let backend handle validation
        }
      }

      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer ' + token;
        print('🔐 KYC Submit: Authorization header set');
      } else {
        print('🔐 KYC Submit: Still no token found, request will fail');
      }

      // Fields
      request.fields['documentType'] = 'STUDENT_CARD';
      request.fields['extractedData'] = jsonEncode(_frontData);

      // Files: front image
      print('🔐 KYC Submit: Front image file info:');
      print('🔐 KYC Submit: - Path: ${_frontImage!.path}');
      print('🔐 KYC Submit: - Exists: ${await _frontImage!.exists()}');
      print('🔐 KYC Submit: - Size: ${await _frontImage!.length()}');

      request.files.add(
        await http.MultipartFile.fromPath('frontImage', _frontImage!.path),
      );

      // For student card, no backImage
      // Selfie: Use actual selfie video file
      if (_selfieVideo != null) {
        print('🔐 KYC Submit: Adding selfie video: ${_selfieVideo!.path}');
        request.files.add(
          await http.MultipartFile.fromPath('selfieImage', _selfieVideo!.path),
        );
      } else {
        print(
          '🔐 KYC Submit: No selfie video found, using front image as fallback',
        );
        request.files.add(
          await http.MultipartFile.fromPath('selfieImage', _frontImage!.path),
        );
      }

      final streamed = await request.send();
      final resp = await http.Response.fromStream(streamed);

      print('🔐 KYC Submit: Response status: ${resp.statusCode}');
      print('🔐 KYC Submit: Response body: ${resp.body}');

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        final responseData = jsonDecode(resp.body);
        print('🔐 KYC Submit: Success response: $responseData');

        // Navigate to success screen
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => KYCSuccessScreen(
                registrationData: widget.registrationData,
                kycData: _frontData!,
              ),
            ),
          );
        }
      } else {
        final errorBody = resp.body;
        print('🔐 KYC Submit: Error response body: $errorBody');

        // Try to parse error message
        String errorMessage = 'Gửi KYC thất bại: ${resp.statusCode}';
        try {
          final errorData = jsonDecode(errorBody);
          if (errorData['error'] != null) {
            errorMessage = errorData['error'];
          }
        } catch (e) {
          print('🔐 KYC Submit: Could not parse error response: $e');
        }

        throw Exception(errorMessage);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi đăng ký: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }
}
