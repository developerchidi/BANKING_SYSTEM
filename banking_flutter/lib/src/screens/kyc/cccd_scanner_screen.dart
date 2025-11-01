import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:ionicons/ionicons.dart';
import 'dart:io';

class CCCDScannerScreen extends StatefulWidget {
  final Function(Map<String, dynamic>) onDataExtracted;
  final String documentType; // 'front' or 'back'
  final String documentCategory; // 'cccd' or 'student_card'

  const CCCDScannerScreen({
    super.key,
    required this.onDataExtracted,
    required this.documentType,
    this.documentCategory = 'student_card', // Default to student card
  });

  @override
  State<CCCDScannerScreen> createState() => _CCCDScannerScreenState();
}

class _CCCDScannerScreenState extends State<CCCDScannerScreen> {
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _isScanning = false;
  String _statusText = 'Đặt thẻ sinh viên vào khung để quét tự động';
  Map<String, dynamic>? _extractedData;
  TextRecognizer? _textRecognizer;
  bool _flashOn = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _textRecognizer = TextRecognizer();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        _cameraController = CameraController(
          _cameras.first,
          ResolutionPreset.high,
          enableAudio: false,
        );

        await _cameraController!.initialize();

        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
          _startScanning();
        }
      }
    } catch (e) {
      print('Camera initialization error: $e');
      setState(() {
        _statusText = 'Không thể khởi tạo camera';
      });
    }
  }

  void _startScanning() {
    if (!_isInitialized || _isScanning) return;

    setState(() {
      _isScanning = true;
    });

    // Start continuous scanning
    _scanForDocument();
  }

  Future<void> _scanForDocument() async {
    if (!_isScanning || _isProcessing) return;

    try {
      final XFile image = await _cameraController!.takePicture();
      await _processImage(image);
    } catch (e) {
      print('Scan error: $e');
    }

    // Continue scanning after a delay
    if (_isScanning && !_isProcessing) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) _scanForDocument();
      });
    }
  }

  Future<void> _processImage(XFile image) async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
      _statusText = 'Đang phân tích hình ảnh...';
    });

    try {
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer!.processImage(inputImage);

      // Debug: Print OCR result
      print('OCR Result: ${recognizedText.text}');
      print('Looking for name patterns...');

      // Extract data based on document type
      final extractedData = _extractDataFromText(recognizedText.text);

      // Debug: Print extracted data
      print('Extracted Data: $extractedData');
      print('Found name: ${extractedData['fullName']}');

      // Check if we have minimum required data
      bool hasValidData = false;
      if (widget.documentCategory == 'student_card') {
        // For student card, need MSSV + full name + university
        hasValidData =
            extractedData.containsKey('studentId') &&
            extractedData.containsKey('fullName') &&
            extractedData.containsKey('university');
      } else if (widget.documentType == 'front') {
        hasValidData =
            extractedData.containsKey('idNumber') &&
            extractedData.containsKey('fullName');
      } else {
        hasValidData =
            extractedData.containsKey('issueDate') &&
            extractedData.containsKey('issuePlace');
      }

      if (hasValidData) {
        setState(() {
          _extractedData = extractedData;
          _statusText = 'Đã trích xuất thông tin thành công!';
        });

        // Auto-capture after successful extraction
        await Future.delayed(const Duration(seconds: 1));
        _stopScanning();

        // Add image path to extracted data
        extractedData['imagePath'] = image.path;

        widget.onDataExtracted(extractedData);
        Navigator.pop(context);
      } else {
        setState(() {
          _statusText =
              'Không tìm thấy thông tin thẻ sinh viên. Điều chỉnh vị trí và thử lại';
        });
      }
    } catch (e) {
      print('OCR processing error: $e');
      setState(() {
        _statusText = 'Lỗi xử lý hình ảnh';
      });
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Map<String, dynamic> _extractDataFromText(String text) {
    // Real OCR data extraction
    final extractedData = <String, dynamic>{};

    if (widget.documentCategory == 'student_card') {
      return _extractStudentCardData(text);
    } else {
      return _extractCCCDData(text);
    }
  }

  Map<String, dynamic> _extractStudentCardData(String text) {
    final extractedData = <String, dynamic>{};

    // Extract MSSV (Mã số sinh viên) - 10 digits for HUTECH
    final mssvRegex = RegExp(r'\b\d{10}\b');
    final mssvMatch = mssvRegex.firstMatch(text);
    if (mssvMatch != null) {
      extractedData['studentId'] = mssvMatch.group(0);
    }

    // Extract full name (look for uppercase Vietnamese names)
    // Improved pattern to catch complete names
    final nameRegex = RegExp(
      r'\b[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]{8,50}\b',
    );
    final nameMatches = nameRegex.allMatches(text);

    print('Found ${nameMatches.length} name matches:');
    for (final match in nameMatches) {
      final name = match.group(0)?.trim();
      print('  - "$name" (length: ${name?.length})');
      if (name != null &&
          name.length > 8 &&
          name.length < 50 &&
          !name.contains('HUTECH') &&
          !name.contains('UNIVERSITY') &&
          !name.contains('THẺ') &&
          !name.contains('SINH') &&
          !name.contains('VIÊN') &&
          !name.contains('ĐẠI') &&
          !name.contains('HỌC') &&
          !name.contains('CÔNG') &&
          !name.contains('NGHỆ') &&
          !name.contains('TP') &&
          !name.contains('HCM') &&
          !name.contains('MSSV') &&
          !name.contains('KHÓA') &&
          !name.contains('NGÀY') &&
          !name.contains('SINH') &&
          !name.contains('QR') &&
          !name.contains('CODE') &&
          !name.contains('MALE') &&
          !name.contains('FEMALE') &&
          !name.contains('BIRTH')) {
        print('  ✓ Selected: "$name"');
        extractedData['fullName'] = name;
        break;
      }
    }

    // Extract date of birth (dd/mm/yyyy format)
    final dobRegex = RegExp(r'\b\d{1,2}/\d{1,2}/\d{4}\b');
    final dobMatch = dobRegex.firstMatch(text);
    if (dobMatch != null) {
      extractedData['dateOfBirth'] = dobMatch.group(0);
    }

    // Extract university name - HUTECH specific
    if (text.contains('HUTECH')) {
      if (text.contains('Đại học Công nghệ Tp.HCM')) {
        extractedData['university'] =
            'HUTECH University - Đại học Công nghệ Tp.HCM';
      } else {
        extractedData['university'] = 'HUTECH University';
      }
    } else {
      // Generic university detection
      final universityKeywords = [
        'Đại học',
        'University',
        'Học viện',
        'Academy',
        'Trường',
        'Bách khoa',
        'Kinh tế',
        'Y',
        'Dược',
        'Luật',
        'Sư phạm',
      ];

      for (final keyword in universityKeywords) {
        if (text.contains(keyword)) {
          final universityRegex = RegExp(
            '$keyword.*?[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+',
          );
          final universityMatch = universityRegex.firstMatch(text);
          if (universityMatch != null) {
            extractedData['university'] = universityMatch.group(0)?.trim();
            break;
          }
        }
      }
    }

    // Extract academic year/khóa (format: 2022 - 2026)
    final academicYearRegex = RegExp(r'\b\d{4}\s*-\s*\d{4}\b');
    final academicYearMatch = academicYearRegex.firstMatch(text);
    if (academicYearMatch != null) {
      extractedData['academicYear'] = academicYearMatch.group(0)?.trim();
    }

    // Extract card type
    if (text.contains('THẺ SINH VIÊN')) {
      extractedData['cardType'] = 'THẺ SINH VIÊN';
    }

    return extractedData;
  }

  Map<String, dynamic> _extractCCCDData(String text) {
    final extractedData = <String, dynamic>{};

    if (widget.documentType == 'front') {
      // Extract CCCD front data
      final idNumberRegex = RegExp(r'\b\d{9,12}\b');
      final idMatch = idNumberRegex.firstMatch(text);

      if (idMatch != null) {
        extractedData['idNumber'] = idMatch.group(0);
      }

      // Extract name (look for Vietnamese name patterns)
      final nameRegex = RegExp(
        r'[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+',
      );
      final nameMatches = nameRegex.allMatches(text);

      for (final match in nameMatches) {
        final name = match.group(0)?.trim();
        if (name != null && name.length > 5 && name.length < 50) {
          extractedData['fullName'] = name;
          break;
        }
      }

      // Extract date of birth
      final dobRegex = RegExp(r'\b\d{1,2}/\d{1,2}/\d{4}\b');
      final dobMatch = dobRegex.firstMatch(text);
      if (dobMatch != null) {
        extractedData['dateOfBirth'] = dobMatch.group(0);
      }

      // Extract gender
      if (text.contains('Nam') || text.contains('Male')) {
        extractedData['gender'] = 'Nam';
      } else if (text.contains('Nữ') || text.contains('Female')) {
        extractedData['gender'] = 'Nữ';
      }

      // Extract nationality
      if (text.contains('Việt Nam') || text.contains('Vietnamese')) {
        extractedData['nationality'] = 'Việt Nam';
      }
    } else {
      // Extract CCCD back data
      final issueDateRegex = RegExp(r'\b\d{1,2}/\d{1,2}/\d{4}\b');
      final issueDateMatches = issueDateRegex.allMatches(text);

      if (issueDateMatches.isNotEmpty) {
        extractedData['issueDate'] = issueDateMatches.first.group(0);
      }

      // Extract issue place
      final placeRegex = RegExp(
        r'Công an.*?[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+',
      );
      final placeMatch = placeRegex.firstMatch(text);
      if (placeMatch != null) {
        extractedData['issuePlace'] = placeMatch.group(0)?.trim();
      }

      // Extract expiry date
      if (issueDateMatches.length > 1) {
        extractedData['expiryDate'] = issueDateMatches.last.group(0);
      }
    }

    return extractedData;
  }

  void _stopScanning() {
    setState(() {
      _isScanning = false;
    });
  }

  void _toggleFlash() {
    if (_cameraController != null) {
      setState(() {
        _flashOn = !_flashOn;
      });
      _cameraController!.setFlashMode(
        _flashOn ? FlashMode.torch : FlashMode.off,
      );
    }
  }

  void _manualCapture() async {
    if (_isInitialized && !_isProcessing) {
      _stopScanning();
      final XFile image = await _cameraController!.takePicture();
      _processImage(image);
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _textRecognizer?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.close, color: Colors.white, size: 20),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Quét thẻ sinh viên',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _flashOn ? Icons.flash_on : Icons.flash_off,
                color: _flashOn ? const Color(0xFFA855F7) : Colors.white,
                size: 20,
              ),
            ),
            onPressed: _toggleFlash,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera Preview
          if (_isInitialized && _cameraController != null)
            Positioned.fill(child: CameraPreview(_cameraController!))
          else
            Container(
              width: double.infinity,
              height: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFF1A1A2E), Color(0xFF16213E)],
                ),
              ),
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFFA855F7)),
              ),
            ),

          // Scanning Overlay
          Positioned.fill(
            child: Container(
              color: Colors.black.withOpacity(0.3),
              child: Column(
                children: [
                  const Spacer(),

                  // Document Frame
                  Container(
                    width: 350,
                    height: 220,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _isScanning
                            ? const Color(0xFFA855F7)
                            : Colors.white,
                        width: 3,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Stack(
                      children: [
                        // Animated scanning line
                        if (_isScanning)
                          Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            child: Container(
                              height: 2,
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    Color(0xFFA855F7),
                                    Colors.transparent,
                                  ],
                                ),
                              ),
                            ),
                          ),

                        // Corner indicators
                        Positioned(
                          top: 0,
                          left: 0,
                          child: Container(
                            width: 25,
                            height: 25,
                            decoration: const BoxDecoration(
                              color: Color(0xFFA855F7),
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(16),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 0,
                          right: 0,
                          child: Container(
                            width: 25,
                            height: 25,
                            decoration: const BoxDecoration(
                              color: Color(0xFFA855F7),
                              borderRadius: BorderRadius.only(
                                topRight: Radius.circular(16),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          left: 0,
                          child: Container(
                            width: 25,
                            height: 25,
                            decoration: const BoxDecoration(
                              color: Color(0xFFA855F7),
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(16),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            width: 25,
                            height: 25,
                            decoration: const BoxDecoration(
                              color: Color(0xFFA855F7),
                              borderRadius: BorderRadius.only(
                                bottomRight: Radius.circular(16),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Status text
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _statusText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  const Spacer(),
                ],
              ),
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                ),
              ),
              child: Column(
                children: [
                  // Instructions
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(
                              Ionicons.information_circle_outline,
                              color: const Color(0xFFA855F7),
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Hướng dẫn:',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '• Đặt thẻ sinh viên vào khung\n• Hệ thống sẽ tự động quét và trích xuất thông tin\n• Đảm bảo ánh sáng đủ và thẻ rõ nét',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            height: 1.4,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Capture Controls
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Manual capture button
                      GestureDetector(
                        onTap: _manualCapture,
                        child: Container(
                          width: 70,
                          height: 70,
                          decoration: BoxDecoration(
                            color: _isProcessing ? Colors.grey : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.3),
                                blurRadius: 10,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: _isProcessing
                              ? const CircularProgressIndicator(
                                  color: Colors.black,
                                  strokeWidth: 3,
                                )
                              : const Icon(
                                  Icons.camera_alt,
                                  color: Colors.black,
                                  size: 30,
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
