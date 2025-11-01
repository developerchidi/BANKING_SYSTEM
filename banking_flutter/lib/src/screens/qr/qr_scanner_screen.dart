import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ionicons/ionicons.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen>
    with TickerProviderStateMixin {
  MobileScannerController? cameraController;
  late AnimationController _scanningController;
  late AnimationController _resultController;
  late Animation<double> _scanningAnimation;
  late Animation<double> _scaleAnimation;

  bool isFlashOn = false;
  String? scannedData;
  bool _hasPermission = false;
  bool _isInitialized = false;
  bool _isFetchingAccountName = false;

  @override
  void initState() {
    super.initState();
    _checkCameraPermission();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _scanningController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _resultController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _scanningAnimation = Tween<double>(begin: -1.0, end: 1.0).animate(
      CurvedAnimation(parent: _scanningController, curve: Curves.linear),
    );

    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _resultController, curve: Curves.elasticOut),
    );

    _scanningController.repeat();
  }

  Future<void> _checkCameraPermission() async {
    final status = await Permission.camera.status;
    if (status.isGranted) {
      setState(() {
        _hasPermission = true;
      });
      _initializeCamera();
    } else {
      final result = await Permission.camera.request();
      if (result.isGranted) {
        setState(() {
          _hasPermission = true;
        });
        _initializeCamera();
      } else {
        _showPermissionError();
      }
    }
  }

  void _initializeCamera() async {
    try {
      print('🔍 QR Scanner: Starting camera initialization...');

      // Dispose existing controller if any
      await cameraController?.dispose();

      // Create new controller with proper configuration
      cameraController = MobileScannerController(
        detectionSpeed: DetectionSpeed.normal,
        facing: CameraFacing.back,
        torchEnabled: false,
      );

      // Wait a bit for camera to initialize
      await Future.delayed(const Duration(milliseconds: 500));

      setState(() {
        _isInitialized = true;
      });

      print('🔍 QR Scanner: Camera initialized successfully');
    } catch (e) {
      print('🔍 QR Scanner: Camera initialization failed: $e');
      _showCameraError();
    }
  }

  void _showPermissionError() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cần quyền camera'),
        content: const Text(
          'Ứng dụng cần quyền camera để quét QR code. Vui lòng cấp quyền trong Settings.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              openAppSettings();
            },
            child: const Text('Mở Settings'),
          ),
        ],
      ),
    );
  }

  void _showCameraError() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Lỗi camera'),
        content: const Text('Không thể khởi tạo camera. Vui lòng thử lại sau.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(); // Close QR scanner
            },
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _onQRDetected(String data) async {
    if (scannedData == null) {
      // Haptic feedback
      HapticFeedback.mediumImpact();

      setState(() {
        scannedData = data;
      });

      _scanningController.stop();
      _resultController.forward();

      // Process the QR code
      _processQRCode(data);
    }
  }

  void _processQRCode(String qrData) {
    print('🔍 QR Scanner: Processing QR data: $qrData');
    print('🔍 QR Scanner: QR data length: ${qrData.length}');
    print('🔍 QR Scanner: QR data type: ${qrData.runtimeType}');

    try {
      // Try to parse as JSON first (our custom format)
      final Map<String, dynamic> qrDataMap = jsonDecode(qrData);
      print('🔍 QR Scanner: Parsed JSON successfully: $qrDataMap');

      if (qrDataMap['type'] == 'banking_transfer') {
        final accountNumber = qrDataMap['accountNumber'] as String?;
        final accountName = qrDataMap['accountName'] as String?;

        print('🔍 QR Scanner: Custom format detected');
        print('🔍 QR Scanner: Account Number: $accountNumber');
        print('🔍 QR Scanner: Account Name: $accountName');

        if (accountNumber != null) {
          print(
            '🔍 QR Scanner: Custom format detected - Account: $accountNumber, Name: $accountName',
          );

          if (accountName != null && accountName.isNotEmpty) {
            print('🔍 QR Scanner: Using account name from QR: $accountName');
            _navigateToTransfer(accountNumber, accountName);
            return;
          } else {
            print(
              '🔍 QR Scanner: Account name missing in QR, fetching from API',
            );
            _fetchAccountName(accountNumber, 'Custom JSON');
            return;
          }
        } else {
          print('🔍 QR Scanner: Missing accountNumber in custom format');
        }
      } else {
        print(
          '🔍 QR Scanner: JSON format detected but not banking_transfer type: ${qrDataMap['type']}',
        );
      }
    } catch (e) {
      print('🔍 QR Scanner: JSON parse failed: $e');
      print('🔍 QR Scanner: Trying other formats...');
    }

    // Try to parse other banking QR formats
    if (_parseVietQR(qrData)) return;
    if (_parseEMVQR(qrData)) return;
    if (_parsePlainAccountNumber(qrData)) return;

    // If no format matches, show error
    print('🔍 QR Scanner: No supported format detected, showing error');
    _showQRParseError(qrData);
  }

  bool _parseVietQR(String qrData) {
    // VietQR format: https://vietqr.net/transfer/{bank_code}/{account_number}
    final vietQRRegex = RegExp(r'https://vietqr\.net/transfer/[^/]+/(\d+)');
    final match = vietQRRegex.firstMatch(qrData);

    if (match != null) {
      final accountNumber = match.group(1);
      print('🔍 QR Scanner: VietQR detected - Account: $accountNumber');
      _fetchAccountName(accountNumber!, 'VietQR');
      return true;
    }
    return false;
  }

  bool _parseEMVQR(String qrData) {
    // EMV QR format: 00020101021238570010A000000727012700069704080108QRIBFTTA53037045802VN6304
    // Look for account numbers in the QR data
    final accountRegex = RegExp(r'(\d{8,12})');
    final matches = accountRegex.allMatches(qrData);

    for (final match in matches) {
      final accountNumber = match.group(1);
      if (accountNumber != null && accountNumber.length >= 8) {
        print('🔍 QR Scanner: EMV QR detected - Account: $accountNumber');
        _fetchAccountName(accountNumber, 'EMV QR');
        return true;
      }
    }
    return false;
  }

  bool _parsePlainAccountNumber(String qrData) {
    // Plain account number: 6-12 digits
    final accountRegex = RegExp(r'^(\d{6,12})$');
    final match = accountRegex.firstMatch(qrData);

    if (match != null) {
      final accountNumber = match.group(1);
      print(
        '🔍 QR Scanner: Plain account number detected - Account: $accountNumber',
      );
      _fetchAccountName(accountNumber!, 'Plain Account');
      return true;
    }
    return false;
  }

  Future<void> _fetchAccountName(String accountNumber, String source) async {
    try {
      setState(() {
        _isFetchingAccountName = true;
      });

      print('🔍 QR Scanner: Fetching account name for: $accountNumber');

      final accountName = await _getAccountNameFromAPI(accountNumber);

      print('🔍 QR Scanner: Account name fetched: $accountName');

      // Ensure we always have a name
      final finalAccountName = accountName ?? 'Người nhận $accountNumber';
      print('🔍 QR Scanner: Final account name: $finalAccountName');

      _navigateToTransfer(accountNumber, finalAccountName);
    } catch (e) {
      print('🔍 QR Scanner: Failed to fetch account name: $e');
      // Fallback to a default name
      _navigateToTransfer(accountNumber, 'Người nhận $accountNumber');
    } finally {
      setState(() {
        _isFetchingAccountName = false;
      });
    }
  }

  Future<String?> _getAccountNameFromAPI(String accountNumber) async {
    try {
      print(
        '🔍 QR Scanner: Attempting to fetch account name for: $accountNumber',
      );

      // Use BankingService to verify account and get name
      final bankingService = BankingService(ApiClient());
      final result = await bankingService.verifyAccount(accountNumber);

      print('🔍 QR Scanner: API response: $result');

      print(
        '🔍 QR Scanner: Full API response structure: ${result.keys.toList()}',
      );

      if (result['success'] == true) {
        final data = result['data'];
        print('🔍 QR Scanner: Data structure: ${data?.keys.toList()}');

        final accountName = data?['accountName'] as String?;
        print('🔍 QR Scanner: Account name from API: $accountName');

        if (accountName != null && accountName.isNotEmpty) {
          print('🔍 QR Scanner: Using API account name: $accountName');
          return accountName;
        } else {
          print('🔍 QR Scanner: Account name is null or empty, using fallback');
          return 'Người nhận $accountNumber';
        }
      } else {
        print(
          '🔍 QR Scanner: Account verification failed - success: ${result['success']}',
        );
        print('🔍 QR Scanner: Error message: ${result['message']}');
        return 'Người nhận $accountNumber';
      }
    } catch (e) {
      print('🔍 QR Scanner: API call failed: $e');
      return 'Người nhận $accountNumber';
    }
  }

  void _navigateToTransfer(String accountNumber, String accountName) {
    print('🔍 QR Scanner: Navigating to transfer with:');
    print('🔍 QR Scanner: - Account Number: $accountNumber');
    print('🔍 QR Scanner: - Account Name: $accountName');

    // Return the parsed data to the calling screen
    final result = {
      'accountNumber': accountNumber,
      'accountName': accountName,
      'bankName': 'Ngân hàng TMCP Quân đội',
    };

    print('🔍 QR Scanner: Returning result: $result');
    Navigator.of(context).pop(result);
  }

  void _showQRParseError(String qrData) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Không thể đọc QR Code'),
        content: Text(
          'QR Code không hợp lệ hoặc không được hỗ trợ.\n\nDữ liệu: $qrData',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _resetScanning();
            },
            child: const Text('Thử lại'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _resetScanning() {
    setState(() {
      scannedData = null;
    });
    _resultController.reset();
    _scanningController.repeat();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            borderRadius: BorderRadius.circular(12),
          ),
          child: IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(
              Ionicons.arrow_back,
              color: Colors.white,
              size: 20,
            ),
          ),
        ),
        title: const Text(
          'Quét mã QR thanh toán',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: _isInitialized
            ? [
                Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    onPressed: () async {
                      await cameraController?.toggleTorch();
                      setState(() {
                        isFlashOn = !isFlashOn;
                      });
                    },
                    icon: Icon(
                      isFlashOn ? Ionicons.flash : Ionicons.flash_off,
                      color: isFlashOn ? Colors.amber : Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ]
            : null,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (!_hasPermission) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Ionicons.camera_outline, color: Colors.white, size: 64),
            SizedBox(height: 16),
            Text(
              'Đang kiểm tra quyền camera...',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ),
      );
    }

    if (!_isInitialized) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
            SizedBox(height: 16),
            Text(
              'Đang khởi tạo camera...',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        // QR Scanner View
        MobileScanner(
          controller: cameraController,
          onDetect: (capture) {
            final List<Barcode> barcodes = capture.barcodes;
            for (final barcode in barcodes) {
              if (barcode.rawValue != null) {
                _onQRDetected(barcode.rawValue!);
                break;
              }
            }
          },
        ),

        // Dark overlay with cutout
        CustomPaint(painter: QRScannerOverlay(), size: Size.infinite),

        // Enhanced Scanner Frame
        Center(
          child: SizedBox(
            width: 280,
            height: 280,
            child: Stack(
              children: [
                // Corner brackets
                ...List.generate(4, (index) {
                  final positions = [
                    {'top': 0.0, 'left': 0.0}, // Top-left
                    {'top': 0.0, 'right': 0.0}, // Top-right
                    {'bottom': 0.0, 'left': 0.0}, // Bottom-left
                    {'bottom': 0.0, 'right': 0.0}, // Bottom-right
                  ];

                  return Positioned(
                    top: positions[index]['top'],
                    left: positions[index]['left'],
                    right: positions[index]['right'],
                    bottom: positions[index]['bottom'],
                    child: _buildCornerBracket(index),
                  );
                }),

                // Scanning line animation
                if (scannedData == null)
                  AnimatedBuilder(
                    animation: _scanningAnimation,
                    builder: (context, child) {
                      return Positioned(
                        left: 20,
                        right: 20,
                        top: 20 + (240 * (_scanningAnimation.value + 1) / 2),
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                const Color(0xFF00D4AA),
                                const Color(0xFF00D4AA).withOpacity(0.8),
                                Colors.transparent,
                              ],
                              stops: const [0.0, 0.3, 0.7, 1.0],
                            ),
                            borderRadius: BorderRadius.circular(2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF00D4AA).withOpacity(0.5),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
        ),

        // Bottom section with enhanced animation
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(32),
                topRight: Radius.circular(32),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 30,
                  offset: const Offset(0, -10),
                ),
              ],
            ),
            child: scannedData == null
                ? _buildScanningUI()
                : _isFetchingAccountName
                ? _buildLoadingUI()
                : _buildResultUI(),
          ),
        ),
      ],
    );
  }

  Widget _buildCornerBracket(int index) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        border: Border(
          top: index < 2
              ? const BorderSide(color: Color(0xFF00D4AA), width: 4)
              : BorderSide.none,
          bottom: index >= 2
              ? const BorderSide(color: Color(0xFF00D4AA), width: 4)
              : BorderSide.none,
          left: index % 2 == 0
              ? const BorderSide(color: Color(0xFF00D4AA), width: 4)
              : BorderSide.none,
          right: index % 2 == 1
              ? const BorderSide(color: Color(0xFF00D4AA), width: 4)
              : BorderSide.none,
        ),
        borderRadius: BorderRadius.only(
          topLeft: index == 0 ? const Radius.circular(16) : Radius.zero,
          topRight: index == 1 ? const Radius.circular(16) : Radius.zero,
          bottomLeft: index == 2 ? const Radius.circular(16) : Radius.zero,
          bottomRight: index == 3 ? const Radius.circular(16) : Radius.zero,
        ),
      ),
    );
  }

  Widget _buildLoadingUI() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF00D4AA).withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00D4AA)),
            strokeWidth: 3,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Đang tìm thông tin tài khoản...',
          style: TextStyle(
            color: Color(0xFF1F2937),
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        const Text(
          'Vui lòng chờ trong giây lát',
          style: TextStyle(color: Color(0xFF6B7280), fontSize: 15, height: 1.4),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildScanningUI() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF00D4AA).withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Icon(
            Ionicons.qr_code_outline,
            color: Color(0xFF00D4AA),
            size: 48,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Quét mã QR để thanh toán',
          style: TextStyle(
            color: Color(0xFF1F2937),
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        const Text(
          'Đặt mã QR vào trong khung và giữ máy ổn định',
          style: TextStyle(color: Color(0xFF6B7280), fontSize: 15, height: 1.4),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        // Tips section
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Icon(
                Ionicons.bulb_outline,
                color: Colors.amber.shade700,
                size: 20,
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Đảm bảo có đủ ánh sáng để quét tốt nhất',
                  style: TextStyle(
                    color: Color(0xFF4B5563),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResultUI() {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  const Color(0xFF00D4AA).withOpacity(0.1),
                  const Color(0xFF00D4AA).withOpacity(0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: const Color(0xFF00D4AA).withOpacity(0.2),
                width: 1.5,
              ),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00D4AA),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Ionicons.checkmark_circle,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Quét thành công!',
                  style: TextStyle(
                    color: Color(0xFF1F2937),
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    scannedData!,
                    style: const TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 14,
                      fontFamily: 'monospace',
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop(scannedData);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00D4AA),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                          shadowColor: const Color(0xFF00D4AA).withOpacity(0.3),
                        ),
                        child: const Text(
                          'Tiếp tục thanh toán',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _resetScanning,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF00D4AA),
                          side: const BorderSide(
                            color: Color(0xFF00D4AA),
                            width: 2,
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Quét lại',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    print('🔍 QR Scanner: Disposing camera controller...');

    _scanningController.dispose();
    _resultController.dispose();

    // Dispose camera controller synchronously
    cameraController?.dispose();

    super.dispose();
    print('🔍 QR Scanner: Camera controller disposed');
  }
}

class QRScannerOverlay extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withOpacity(0.6)
      ..style = PaintingStyle.fill;

    final centerX = size.width / 2;
    final centerY = size.height / 2;
    const scanAreaSize = 280.0;

    final scanRect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset(centerX, centerY),
        width: scanAreaSize,
        height: scanAreaSize,
      ),
      const Radius.circular(24),
    );

    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(scanRect)
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
