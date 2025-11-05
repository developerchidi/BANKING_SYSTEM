import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';
import 'dart:async';

class SelfieCaptureScreen extends StatefulWidget {
  final Function(File) onVideoCaptured;

  const SelfieCaptureScreen({
    super.key,
    required this.onVideoCaptured,
  });

  @override
  State<SelfieCaptureScreen> createState() => _SelfieCaptureScreenState();
}

class _SelfieCaptureScreenState extends State<SelfieCaptureScreen>
    with TickerProviderStateMixin {
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _isRecording = false;
  bool _isCountdown = false;
  int _countdownValue = 3;
  String _statusText = 'Đặt khuôn mặt vào khung để quay video';
  int _recordingDuration = 0;
  Timer? _recordingTimer;
  Timer? _countdownTimer;
  
  // Face detection
  FaceDetector? _faceDetector;
  List<Face> _detectedFaces = [];
  bool _faceDetected = false;
  bool _faceInFrame = false;
  
  // Animation
  AnimationController? _animationController;
  Animation<double>? _scanLineAnimation;
  Animation<double>? _pulseAnimation;
  
  // Face frame - Optimized size for better face fit
  Rect? _faceFrame;
  double _faceFrameWidth = 280.0;
  double _faceFrameHeight = 360.0;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializeFaceDetection();
    _initializeAnimations();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _faceDetector?.close();
    _animationController?.dispose();
    _recordingTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        setState(() {
          _statusText = 'Không tìm thấy camera';
        });
        return;
      }

      // Use front camera for selfie
      final frontCamera = _cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      await _cameraController!.initialize();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
        _startFaceDetection();
      }
    } catch (e) {
      setState(() {
        _statusText = 'Lỗi khởi tạo camera: $e';
      });
    }
  }

  Future<void> _initializeFaceDetection() async {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableContours: true,
        enableLandmarks: true,
        enableClassification: true,
        enableTracking: true,
        minFaceSize: 0.1,
        performanceMode: FaceDetectorMode.accurate,
      ),
    );
  }

  void _initializeAnimations() {
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _scanLineAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Curves.easeInOut,
    ));

    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Curves.easeInOut,
    ));

    _animationController!.repeat(reverse: true);
  }

  void _startFaceDetection() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    _cameraController!.startImageStream((CameraImage image) {
      if (_isProcessing) return;
      
      _processImageForFaceDetection(image);
    });
  }

  Future<void> _processImageForFaceDetection(CameraImage image) async {
    if (_faceDetector == null) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      final inputImage = _inputImageFromCameraImage(image);
      if (inputImage == null) return;

      final faces = await _faceDetector!.processImage(inputImage);
      
      if (mounted) {
        setState(() {
          _detectedFaces = faces;
          _faceDetected = faces.isNotEmpty;
          
          if (_faceDetected) {
            _updateFaceFrame(faces.first);
            _statusText = 'Khuôn mặt đã được phát hiện. Giữ nguyên vị trí...';
          } else {
            _statusText = 'Đặt khuôn mặt vào khung để quét';
          }
        });
      }
    } catch (e) {
      print('Face detection error: $e');
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  InputImage? _inputImageFromCameraImage(CameraImage image) {
    final camera = _cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => _cameras.first,
    );

    final sensorOrientation = camera.sensorOrientation;
    
    return InputImage.fromBytes(
      bytes: _concatenatePlanes(image.planes),
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: _getImageRotation(sensorOrientation),
        format: InputImageFormat.yuv420,
        bytesPerRow: image.planes.first.bytesPerRow,
      ),
    );
  }

  Uint8List _concatenatePlanes(List<Plane> planes) {
    final allBytes = BytesBuilder();
    for (final plane in planes) {
      allBytes.add(plane.bytes);
    }
    return allBytes.toBytes();
  }

  InputImageRotation _getImageRotation(int sensorOrientation) {
    switch (sensorOrientation) {
      case 90:
        return InputImageRotation.rotation90deg;
      case 180:
        return InputImageRotation.rotation180deg;
      case 270:
        return InputImageRotation.rotation270deg;
      default:
        return InputImageRotation.rotation0deg;
    }
  }

  void _updateFaceFrame(Face face) {
    // Fixed frame position - user adjusts face to fit frame
    final screenSize = MediaQuery.of(context).size;
    
    // Fixed frame size and position (centered on screen)
    final frameWidth = 280.0;
    final frameHeight = 360.0;
    
    // Center the frame on screen
    final frameLeft = (screenSize.width - frameWidth) / 2;
    final frameTop = (screenSize.height - frameHeight) / 2;
    
    _faceFrame = Rect.fromLTWH(frameLeft, frameTop, frameWidth, frameHeight);
    
    // Check if face is within the frame for validation
    final cameraSize = _cameraController!.value.previewSize!;
    final scaleX = screenSize.width / cameraSize.height;
    final scaleY = screenSize.height / cameraSize.width;
    
    final faceLeft = face.boundingBox.left * scaleX;
    final faceTop = face.boundingBox.top * scaleY;
    final faceWidth = face.boundingBox.width * scaleX;
    final faceHeight = face.boundingBox.height * scaleY;
    
    // Check if face is properly positioned within frame
    final faceCenterX = faceLeft + faceWidth / 2;
    final faceCenterY = faceTop + faceHeight / 2;
    final frameCenterX = frameLeft + frameWidth / 2;
    final frameCenterY = frameTop + frameHeight / 2;
    
    // Calculate distance from face center to frame center
    final distanceX = (faceCenterX - frameCenterX).abs();
    final distanceY = (faceCenterY - frameCenterY).abs();
    
    // Face is considered "in frame" if within 80px of center (more lenient)
    final isInFrame = distanceX < 80 && distanceY < 80;
    
    setState(() {
      _faceDetected = true;
      _faceInFrame = isInFrame;
      
      if (isInFrame) {
        _statusText = 'Khuôn mặt đã được phát hiện. Giữ nguyên vị trí...';
        
        // Auto start countdown if face is in frame and not already recording/counting
        if (!_isCountdown && !_isRecording) {
          // Delay 1 second to ensure face is stable
          Future.delayed(const Duration(seconds: 1), () {
            if (_faceDetected && _faceInFrame && !_isCountdown && !_isRecording) {
              _startCountdown();
            }
          });
        }
      } else {
        _statusText = 'Điều chỉnh khuôn mặt vào khung bầu dục';
      }
    });
    
    print('Face detected - in frame: $isInFrame');
  }

  void _startCountdown() {
    setState(() {
      _isCountdown = true;
      _countdownValue = 3;
      _statusText = 'Chuẩn bị quay video...';
    });

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _countdownValue--;
        _statusText = 'Chuẩn bị quay video... $_countdownValue';
      });

      if (_countdownValue <= 0) {
        timer.cancel();
        _startVideoRecording();
      }
    });
  }

  Future<bool> _checkPermissions() async {
    // Check camera permission
    final cameraStatus = await Permission.camera.status;
    if (!cameraStatus.isGranted) {
      final cameraResult = await Permission.camera.request();
      if (!cameraResult.isGranted) {
        setState(() {
          _statusText = 'Cần quyền camera để quay video';
        });
        return false;
      }
    }

    // Check microphone permission
    final micStatus = await Permission.microphone.status;
    if (!micStatus.isGranted) {
      final micResult = await Permission.microphone.request();
      if (!micResult.isGranted) {
        setState(() {
          _statusText = 'Cần quyền microphone để quay video';
        });
        return false;
      }
    }

    return true;
  }

  Future<void> _startVideoRecording() async {
    if (_isRecording) return;

    // Check permissions first
    final hasPermissions = await _checkPermissions();
    if (!hasPermissions) {
      return;
    }

    try {
      print('Starting video recording...');
      await _cameraController!.startVideoRecording();
      print('Video recording started successfully');
      
      setState(() {
        _isRecording = true;
        _isCountdown = false;
        _recordingDuration = 0;
        _statusText = 'Đang quay video... Giữ nguyên vị trí';
      });

      // Start recording timer
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _recordingDuration++;
        });
        
        print('Recording duration: $_recordingDuration seconds');
        
        // Stop recording after 3 seconds
        if (_recordingDuration >= 3) {
          print('Stopping recording after 3 seconds');
          timer.cancel();
          _stopVideoRecording();
        }
      });

    } catch (e) {
      print('Error starting video recording: $e');
      setState(() {
        _isCountdown = false;
        _statusText = 'Lỗi bắt đầu quay video: $e';
      });
    }
  }

  Future<void> _stopVideoRecording() async {
    print('_stopVideoRecording called, _isRecording: $_isRecording');
    
    if (!_isRecording) return;

    try {
      print('Stopping video recording...');
      final videoFile = await _cameraController!.stopVideoRecording();
      print('Video recording stopped, file: ${videoFile.path}');
      
      _recordingTimer?.cancel();
      
      setState(() {
        _isRecording = false;
        _recordingDuration = 0;
        _statusText = 'Video selfie đã được ghi nhận thành công!';
      });

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Video selfie đã được ghi nhận thành công!'),
          backgroundColor: Color(0xFF27AE60),
          duration: Duration(seconds: 2),
        ),
      );

      // Call callback with video file
      print('Calling onVideoCaptured with file: ${videoFile.path}');
      widget.onVideoCaptured(File(videoFile.path));
      
      // Auto close this screen shortly after callback so parent can advance
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          print('Auto closing selfie capture screen');
          Navigator.pop(context);
        }
      });
      
    } catch (e) {
      print('Error stopping video recording: $e');
      setState(() {
        _isRecording = false;
        _recordingDuration = 0;
        _statusText = 'Lỗi dừng quay video: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera Preview - Full Screen
          if (_isInitialized && _cameraController != null)
            Positioned.fill(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final size = _cameraController!.value.previewSize;
                  if (size == null) {
                    return CameraPreview(_cameraController!);
                  }
                  // Swap width/height for portrait and cover the screen without distortion
                  final previewW = size.height;
                  final previewH = size.width;
                  return FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width: previewW,
                      height: previewH,
                      child: CameraPreview(_cameraController!),
                    ),
                  );
                },
              ),
            )
          else
            Container(
              color: Colors.black,
              child: const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFFA855F7),
                ),
              ),
            ),

          // Custom App Bar - Minimal
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 20,
                right: 20,
                bottom: 16,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(
                                                alpha:0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(
                                                alpha:0.5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      _isCountdown 
                          ? 'Chuẩn bị quay video... $_countdownValue'
                          : _isRecording 
                              ? 'Quay video selfie ($_recordingDuration/3s)' 
                              : 'Quay video selfie',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Fixed Face Frame - Always Visible
          Center(
            child: Container(
              width: 280.0,
              height: 360.0,
              decoration: BoxDecoration(
                border: Border.all(
                  color: _faceDetected 
                      ? (_faceInFrame 
                          ? const Color(0xFF27AE60)  // Green when in frame
                          : const Color(0xFFFF6B6B)) // Red when not in frame
                      : Colors.white.withValues(
                                                alpha:0.3), // White when no face detected
                  width: 4,
                ),
                shape: BoxShape.rectangle,
                borderRadius: BorderRadius.circular(180.0), // Half of height for oval
              ),
              child: Stack(
                children: [
                  // Corner indicators (oval style)
                  ..._buildFixedCornerIndicators(),
                  // Scanning line (oval path)
                  if (_scanLineAnimation != null)
                    AnimatedBuilder(
                      animation: _scanLineAnimation!,
                      builder: (context, child) {
                        return CustomPaint(
                          size: const Size(280.0, 360.0),
                          painter: OvalScanLinePainter(
                            progress: _scanLineAnimation!.value,
                            color: _faceDetected 
                                ? (_faceInFrame 
                                    ? const Color(0xFF27AE60)
                                    : const Color(0xFFFF6B6B))
                                : Colors.white.withValues(
                                                alpha:0.5),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),

          // Status Text - Top Center
          Positioned(
            top: MediaQuery.of(context).padding.top + 120,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.black.withValues(
                                                alpha:0.7),
                borderRadius: BorderRadius.circular(25),
                border: Border.all(
                  color: Colors.white.withValues(
                                                alpha:0.2),
                  width: 1,
                ),
              ),
              child: Text(
                _statusText,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

          // Record Button - Bottom Center
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isRecording 
                      ? const Color(0xFFE74C3C)  // Red when recording
                      : _isCountdown 
                          ? const Color(0xFFFF9500)  // Orange when countdown
                          : _faceDetected && _faceInFrame
                              ? const Color(0xFF27AE60)  // Green when ready
                              : Colors.grey.withValues(
                                                alpha:0.5),  // Grey when not ready
                  border: Border.all(
                    color: Colors.white,
                    width: 4,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _isRecording 
                          ? const Color(0xFFE74C3C).withValues(
                                                alpha:0.3)
                          : _isCountdown 
                              ? const Color(0xFFFF9500).withValues(
                                                alpha:0.3)
                              : _faceDetected && _faceInFrame
                                  ? const Color(0xFF27AE60).withValues(
                                                alpha:0.3)
                                  : Colors.grey.withValues(
                                                alpha:0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: _isCountdown 
                    ? Text(
                        '$_countdownValue',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : Icon(
                        _isRecording ? Icons.stop : Icons.videocam,
                        color: Colors.white,
                        size: 32,
                      ),
              ),
            ),
          ),

          // Instructions - Bottom
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(
                                                alpha:0.7),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.white.withValues(
                                                alpha:0.2),
                  width: 1,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.face,
                    color: Color(0xFFA855F7),
                    size: 24,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Hướng dẫn quay video selfie',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '• Đặt khuôn mặt vào khung bầu dục cố định\n• Điều chỉnh vị trí để căn giữa khuôn mặt\n• Video sẽ tự động quay 3 giây\n• Giữ nguyên vị trí trong khi quay',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildFixedCornerIndicators() {
    return [
      // Top indicators
      Positioned(
        top: 10,
        left: 140.0 - 15, // Center of 280px width
        child: Container(
          width: 30,
          height: 6,
          decoration: BoxDecoration(
            color: _faceDetected 
                ? (_faceInFrame 
                    ? const Color(0xFF27AE60)
                    : const Color(0xFFFF6B6B))
                : Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
      // Bottom indicators
      Positioned(
        bottom: 10,
        left: 140.0 - 15, // Center of 280px width
        child: Container(
          width: 30,
          height: 6,
          decoration: BoxDecoration(
            color: _faceDetected 
                ? (_faceInFrame 
                    ? const Color(0xFF27AE60)
                    : const Color(0xFFFF6B6B))
                : Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
      // Left indicators
      Positioned(
        left: 10,
        top: 180.0 - 15, // Center of 360px height
        child: Container(
          width: 6,
          height: 30,
          decoration: BoxDecoration(
            color: _faceDetected 
                ? (_faceInFrame 
                    ? const Color(0xFF27AE60)
                    : const Color(0xFFFF6B6B))
                : Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
      // Right indicators
      Positioned(
        right: 10,
        top: 180.0 - 15, // Center of 360px height
        child: Container(
          width: 6,
          height: 30,
          decoration: BoxDecoration(
            color: _faceDetected 
                ? (_faceInFrame 
                    ? const Color(0xFF27AE60)
                    : const Color(0xFFFF6B6B))
                : Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    ];
  }

  List<Widget> _buildOvalGuideCornerIndicators() {
    return [
      // Top indicators
      Positioned(
        top: 10,
        left: _faceFrameWidth / 2 - 15,
        child: Container(
          width: 30,
          height: 6,
          decoration: BoxDecoration(
            color: Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
      // Bottom indicators
      Positioned(
        bottom: 10,
        left: _faceFrameWidth / 2 - 15,
        child: Container(
          width: 30,
          height: 6,
          decoration: BoxDecoration(
            color: Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
      // Left indicators
      Positioned(
        left: 10,
        top: _faceFrameHeight / 2 - 15,
        child: Container(
          width: 6,
          height: 30,
          decoration: BoxDecoration(
            color: Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
      // Right indicators
      Positioned(
        right: 10,
        top: _faceFrameHeight / 2 - 15,
        child: Container(
          width: 6,
          height: 30,
          decoration: BoxDecoration(
            color: Colors.white.withValues(
                                                alpha:0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    ];
  }
}

class OvalScanLinePainter extends CustomPainter {
  final double progress;
  final Color color;

  OvalScanLinePainter({
    required this.progress,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radiusX = size.width / 2 - 10;
    final radiusY = size.height / 2 - 10;

    // Create oval path
    final path = Path();
    path.addOval(Rect.fromCenter(
      center: center,
      width: radiusX * 2,
      height: radiusY * 2,
    ));

    // Create scan line effect
    final scanPath = Path();
    final scanY = progress * size.height;
    
    // Draw horizontal scan line across the oval
    if (scanY >= 0 && scanY <= size.height) {
      final x1 = center.dx - radiusX * (1 - (scanY - center.dy).abs() / radiusY);
      final x2 = center.dx + radiusX * (1 - (scanY - center.dy).abs() / radiusY);
      
      if (x1 < x2) {
        scanPath.moveTo(x1, scanY);
        scanPath.lineTo(x2, scanY);
        
        // Add glow effect
        final glowPaint = Paint()
          ..color = color.withValues(
                                                alpha:0.3)
          ..strokeWidth = 8.0
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round;
        
        canvas.drawPath(scanPath, glowPaint);
        canvas.drawPath(scanPath, paint);
      }
    }
  }

  @override
  bool shouldRepaint(OvalScanLinePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}