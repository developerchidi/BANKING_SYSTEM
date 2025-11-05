import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:gal/gal.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../theme/theme_provider.dart';
import '../theme/fintech_theme.dart';

class QRSaveService {
  static const String _appName = 'Chidi Bank';

  /// Lưu QR code thành ảnh vào thư viện ảnh
  static Future<bool> saveQRToGallery({
    required String qrData,
    required String accountNumber,
    required String accountName,
    required UserTier userTier,
    String? customFileName,
  }) async {
    try {
      final hasPermission = await _requestStoragePermission();
      if (!hasPermission) {
        return false;
      }

      final imageBytes = await _generateQRImage(
        qrData: qrData,
        accountNumber: accountNumber,
        accountName: accountName,
        userTier: userTier,
      );

      if (imageBytes == null) {
        return false;
      }

      final fileName =
          customFileName ??
          'QR_ChuyenTien_${accountNumber}_${DateTime.now().millisecondsSinceEpoch}.png';

      await Gal.putImageBytes(imageBytes, name: fileName);
      return true;
    } catch (e) {
      print('❌ QRSaveService: Error saving QR: $e');
      return false;
    }
  }

  /// Kiểm tra và yêu cầu quyền truy cập thư viện ảnh
  static Future<bool> _requestStoragePermission() async {
    try {
      final status = await Permission.photos.status;
      if (status.isGranted) {
        return true;
      }

      if (status.isPermanentlyDenied) {
        return false;
      }

      final result = await Permission.photos.request();
      if (result.isDenied || result.isPermanentlyDenied) {
        return false;
      }

      return result.isGranted;
    } catch (e) {
      print('❌ QRSaveService: Permission error: $e');
      return false;
    }
  }

  /// Tạo ảnh QR với thiết kế đẹp và chuyên nghiệp theo tier
  static Future<Uint8List?> _generateQRImage({
    required String qrData,
    required String accountNumber,
    required String accountName,
    required UserTier userTier,
  }) async {
    try {
      const double canvasWidth = 1080.0;
      const double canvasHeight = 1350.0;
      const double qrSize = 720.0;

      final qrPainter = QrPainter.withQr(
        qr: QrCode.fromData(
          data: qrData,
          errorCorrectLevel: QrErrorCorrectLevel.H,
        ),
        color: const Color(0xFF1F2937),
        emptyColor: Colors.white,
        gapless: false,
      );

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(
        recorder,
        Rect.fromLTWH(0, 0, canvasWidth, canvasHeight),
      );

      // Vẽ nền gradient theo tier
      _drawTierBackground(canvas, canvasWidth, canvasHeight, userTier);

      // Vẽ header với thiết kế hiện đại theo tier
      _drawTierHeader(canvas, canvasWidth, userTier);

      // Vẽ container chứa QR code với shadow đẹp
      const double qrContainerPadding = 40.0;
      final qrContainerTop =
          180.0; // Giảm từ 220 xuống 180 để thu hẹp khoảng cách
      final qrContainerRect = Rect.fromLTWH(
        (canvasWidth - qrSize - qrContainerPadding * 2) / 2,
        qrContainerTop,
        qrSize + qrContainerPadding * 2,
        qrSize + qrContainerPadding * 2,
      );

      // Vẽ shadow cho container
      _drawShadow(canvas, qrContainerRect, 20);

      // Vẽ container trắng cho QR
      final qrContainerPaint = Paint()..color = Colors.white;
      canvas.drawRRect(
        RRect.fromRectAndRadius(qrContainerRect, const Radius.circular(32)),
        qrContainerPaint,
      );

      // Vẽ 4 góc trang trí (scanner corners) theo tier
      _drawTierScannerCorners(canvas, qrContainerRect, userTier);

      // Vẽ QR code
      final qrOffset = Offset(
        (canvasWidth - qrSize) / 2,
        qrContainerTop + qrContainerPadding,
      );
      canvas.save();
      canvas.translate(qrOffset.dx, qrOffset.dy);
      qrPainter.paint(canvas, Size(qrSize, qrSize));
      canvas.restore();

      // Vẽ logo ở giữa QR theo tier
      _drawTierCenterLogo(
        canvas,
        qrOffset.dx + qrSize / 2,
        qrOffset.dy + qrSize / 2,
        userTier,
      );

      // Vẽ thông tin tài khoản với thiết kế card đẹp theo tier
      _drawTierAccountCard(
        canvas,
        accountName,
        accountNumber,
        canvasWidth,
        qrContainerTop + qrSize + qrContainerPadding * 2 + 40,
        userTier,
      );

      // Vẽ footer hiện đại theo tier
      _drawTierFooter(canvas, canvasWidth, canvasHeight, userTier);

      // Hoàn thành và chuyển thành ảnh với kích thước chính xác
      final picture = recorder.endRecording();
      final image = await picture.toImage(
        canvasWidth.round(),
        canvasHeight.round(),
      );
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (e) {
      print('❌ QRSaveService: Generate QR image error: $e');
      return null;
    }
  }

  /// Vẽ nền gradient theo tier
  static void _drawTierBackground(
    Canvas canvas,
    double width,
    double height,
    UserTier userTier,
  ) {
    final gradient = FintechTheme.getGradient(userTier);
    final gradientPaint = Paint()
      ..shader = gradient.createShader(Rect.fromLTWH(0, 0, width, height));
    canvas.drawRect(Rect.fromLTWH(0, 0, width, height), gradientPaint);
  }

  /// Vẽ shadow cho element
  static void _drawShadow(Canvas canvas, Rect rect, double blur) {
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(
                                                alpha:0.08)
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, blur);
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect.inflate(8), const Radius.circular(32)),
      shadowPaint,
    );
  }

  /// Vẽ header hiện đại với icon ngân hàng và tên
  static void _drawTierHeader(
    Canvas canvas,
    double canvasWidth,
    UserTier userTier,
  ) {
    final primaryColor = FintechTheme.getPrimaryColor(userTier);
    final secondaryColor = FintechTheme.getSecondaryColor(userTier);
    final accentColor = FintechTheme.getAccentColor(userTier);

    // Tính toán kích thước
    const double iconSize = 80.0; // Tăng kích thước icon để nổi bật hơn
    const double spacing = 20.0; // Tăng khoảng cách giữa icon và text

    // Tạo TextPainter để đo kích thước text
    final bankNamePainter = TextPainter(
      text: TextSpan(
        text: 'CHIDI BANK',
        style: TextStyle(
          fontSize: 60, // Tăng font size để cân đối với icon lớn hơn
          fontWeight: FontWeight.bold,
          color: Colors.white,
          letterSpacing: -0.5,
          shadows: [
            Shadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    bankNamePainter.layout();

    // Tính toán tổng chiều rộng và vị trí bắt đầu để căn giữa
    final totalWidth = iconSize + spacing + bankNamePainter.width;
    final startX = (canvasWidth - totalWidth) / 2;
    final centerY = 70.0;

    // Vẽ icon ngân hàng bên trái
    final iconRect = Rect.fromLTWH(
      startX,
      centerY - iconSize / 2,
      iconSize,
      iconSize,
    );

    // Vẽ shadow cho icon
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.25)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        iconRect.translate(0, 3),
        const Radius.circular(14),
      ),
      shadowPaint,
    );

    // Vẽ nền gradient cho icon
    final iconBgPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Colors.white, Colors.white.withValues(alpha: 0.95)],
      ).createShader(iconRect);
    canvas.drawRRect(
      RRect.fromRectAndRadius(iconRect, const Radius.circular(14)),
      iconBgPaint,
    );

    // Vẽ icon building (ngân hàng) với màu gradient theo tier
    final iconPaint = Paint()
      ..shader = LinearGradient(
        colors: [primaryColor, accentColor],
      ).createShader(iconRect);

    // Vẽ building chính
    final buildingRect = Rect.fromCenter(
      center: iconRect.center,
      width: 28,
      height: 32,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(buildingRect, const Radius.circular(3)),
      iconPaint,
    );

    // Vẽ 3 cột trụ (columns)
    final columnPaint = Paint()..color = Colors.white;
    for (int i = 0; i < 3; i++) {
      final columnRect = Rect.fromCenter(
        center: Offset(iconRect.center.dx - 9 + i * 9, iconRect.center.dy + 4),
        width: 5,
        height: 20,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(columnRect, const Radius.circular(1)),
        columnPaint,
      );
    }

    // Vẽ mái nhà (roof) - hình tam giác
    final roofPath = Path()
      ..moveTo(iconRect.center.dx, buildingRect.top - 6)
      ..lineTo(buildingRect.left - 2, buildingRect.top)
      ..lineTo(buildingRect.right + 2, buildingRect.top)
      ..close();
    canvas.drawPath(roofPath, iconPaint);

    // Vẽ cửa (door) ở dưới
    final doorRect = Rect.fromCenter(
      center: Offset(iconRect.center.dx, buildingRect.bottom - 5),
      width: 8,
      height: 10,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(doorRect, const Radius.circular(1)),
      columnPaint,
    );

    // Vẽ tên ngân hàng bên phải icon
    bankNamePainter.paint(
      canvas,
      Offset(startX + iconSize + spacing, centerY - bankNamePainter.height / 2),
    );

    // Vẽ tier badge bên dưới
    final tierName = FintechTheme.getTierDisplayName(userTier);
    final tierPainter = TextPainter(
      text: TextSpan(
        text: tierName,
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          letterSpacing: 1.5,
          shadows: [
            Shadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    tierPainter.layout();

    // Vẽ nền cho tier badge
    final tierBadgeRect = Rect.fromCenter(
      center: Offset(canvasWidth / 2, 140),
      width: tierPainter.width + 32,
      height: 36,
    );
    final tierBgPaint = Paint()..color = Colors.white.withValues(alpha: 0.2);
    canvas.drawRRect(
      RRect.fromRectAndRadius(tierBadgeRect, const Radius.circular(18)),
      tierBgPaint,
    );

    // Vẽ text tier
    tierPainter.paint(
      canvas,
      Offset(
        (canvasWidth - tierPainter.width) / 2,
        140 - tierPainter.height / 2,
      ),
    );
  }

  /// Vẽ 4 góc scanner theo tier
  static void _drawTierScannerCorners(
    Canvas canvas,
    Rect containerRect,
    UserTier userTier,
  ) {
    final primaryColor = FintechTheme.getPrimaryColor(userTier);
    final accentColor = FintechTheme.getAccentColor(userTier);

    final cornerPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round
      ..shader = LinearGradient(
        colors: [accentColor, primaryColor],
      ).createShader(containerRect);

    const double cornerLength = 36;
    const double cornerInset = 20;

    // Top-left corner
    canvas.drawPath(
      Path()
        ..moveTo(
          containerRect.left + cornerInset + cornerLength,
          containerRect.top + cornerInset,
        )
        ..lineTo(
          containerRect.left + cornerInset,
          containerRect.top + cornerInset,
        )
        ..lineTo(
          containerRect.left + cornerInset,
          containerRect.top + cornerInset + cornerLength,
        ),
      cornerPaint,
    );

    // Top-right corner
    canvas.drawPath(
      Path()
        ..moveTo(
          containerRect.right - cornerInset - cornerLength,
          containerRect.top + cornerInset,
        )
        ..lineTo(
          containerRect.right - cornerInset,
          containerRect.top + cornerInset,
        )
        ..lineTo(
          containerRect.right - cornerInset,
          containerRect.top + cornerInset + cornerLength,
        ),
      cornerPaint,
    );

    // Bottom-left corner
    canvas.drawPath(
      Path()
        ..moveTo(
          containerRect.left + cornerInset,
          containerRect.bottom - cornerInset - cornerLength,
        )
        ..lineTo(
          containerRect.left + cornerInset,
          containerRect.bottom - cornerInset,
        )
        ..lineTo(
          containerRect.left + cornerInset + cornerLength,
          containerRect.bottom - cornerInset,
        ),
      cornerPaint,
    );

    // Bottom-right corner
    canvas.drawPath(
      Path()
        ..moveTo(
          containerRect.right - cornerInset,
          containerRect.bottom - cornerInset - cornerLength,
        )
        ..lineTo(
          containerRect.right - cornerInset,
          containerRect.bottom - cornerInset,
        )
        ..lineTo(
          containerRect.right - cornerInset - cornerLength,
          containerRect.bottom - cornerInset,
        ),
      cornerPaint,
    );
  }

  /// Vẽ logo ở giữa QR code theo tier
  static void _drawTierCenterLogo(
    Canvas canvas,
    double centerX,
    double centerY,
    UserTier userTier,
  ) {
    const double logoSize = 80;
    final logoRect = Rect.fromCenter(
      center: Offset(centerX, centerY),
      width: logoSize,
      height: logoSize,
    );

    final primaryColor = FintechTheme.getPrimaryColor(userTier);
    final accentColor = FintechTheme.getAccentColor(userTier);

    // Vẽ nền trắng cho logo
    final logoBgPaint = Paint()..color = Colors.white;
    canvas.drawRRect(
      RRect.fromRectAndRadius(logoRect, const Radius.circular(16)),
      logoBgPaint,
    );

    // Vẽ logo gradient theo tier
    final logoPaint = Paint()
      ..shader = LinearGradient(
        colors: [accentColor, primaryColor],
      ).createShader(logoRect);
    canvas.drawRRect(
      RRect.fromRectAndRadius(logoRect.deflate(8), const Radius.circular(12)),
      logoPaint,
    );

    // Vẽ chữ C với màu theo tier
    final textPainter = TextPainter(
      text: const TextSpan(
        text: 'C',
        style: TextStyle(
          fontSize: 44,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(centerX - textPainter.width / 2, centerY - textPainter.height / 2),
    );
  }

  /// Vẽ thông tin tài khoản đơn giản - chỉ text căn giữa màu trắng
  static void _drawTierAccountCard(
    Canvas canvas,
    String accountName,
    String accountNumber,
    double canvasWidth,
    double yOffset,
    UserTier userTier,
  ) {
    // Tên tài khoản - căn giữa màu trắng
    final namePainter = TextPainter(
      text: TextSpan(
        text: accountName,
        style: const TextStyle(
          fontSize: 45,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      textDirection: TextDirection.ltr,
      maxLines: 1,
      ellipsis: '...',
    );
    namePainter.layout();
    namePainter.paint(
      canvas,
      Offset((canvasWidth - namePainter.width) / 2, yOffset + 30),
    );

    // Số tài khoản - căn giữa màu trắng
    final accountPainter = TextPainter(
      text: TextSpan(
        text: accountNumber,
        style: const TextStyle(
          fontSize: 40,
          color: Colors.white,
          letterSpacing: 2.5,
          fontWeight: FontWeight.w500,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    accountPainter.layout();
    accountPainter.paint(
      canvas,
      Offset((canvasWidth - accountPainter.width) / 2, yOffset + 70),
    );
  }

  /// Vẽ footer hiện đại theo tier
  static void _drawTierFooter(
    Canvas canvas,
    double width,
    double height,
    UserTier userTier,
  ) {
    final primaryColor = FintechTheme.getPrimaryColor(userTier);
    final accentColor = FintechTheme.getAccentColor(userTier);

    // Divider với gradient theo tier
    final dividerPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          primaryColor.withValues(alpha: 0.3),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, height - 140, width, 2));
    canvas.drawRect(
      Rect.fromLTWH(120, height - 140, width - 240, 2),
      dividerPaint,
    );

    // Icon hướng dẫn theo tier
    final iconPaint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    final iconCenter = Offset(width / 2 - 100, height - 100);
    canvas.drawCircle(iconCenter, 16, iconPaint);
    canvas.drawPath(
      Path()
        ..moveTo(iconCenter.dx - 6, iconCenter.dy - 4)
        ..lineTo(iconCenter.dx + 6, iconCenter.dy - 4)
        ..moveTo(iconCenter.dx - 6, iconCenter.dy + 4)
        ..lineTo(iconCenter.dx + 6, iconCenter.dy + 4),
      iconPaint..strokeWidth = 2,
    );

    // Hướng dẫn
    final instructionPainter = TextPainter(
      text: const TextSpan(
        text: 'Quét mã QR để chuyển tiền',
        style: TextStyle(
          fontSize: 22,
          color: Color(0xFF6B7280),
          fontWeight: FontWeight.w500,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    instructionPainter.layout();
    instructionPainter.paint(
      canvas,
      Offset((width - instructionPainter.width) / 2 + 30, height - 110),
    );

    // Watermark theo tier
    final watermarkPainter = TextPainter(
      text: TextSpan(
        children: [
          TextSpan(
            text: 'Tạo bởi ',
            style: TextStyle(fontSize: 18, color: Colors.grey[400]),
          ),
          TextSpan(
            text: _appName,
            style: TextStyle(
              fontSize: 18,
              color: primaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      textDirection: TextDirection.ltr,
    );
    watermarkPainter.layout();
    watermarkPainter.paint(
      canvas,
      Offset((width - watermarkPainter.width) / 2, height - 60),
    );
  }

  /// Widget QR code để hiển thị trong app
  static Widget buildQRWidget({
    required String qrData,
    required String accountNumber,
    required String accountName,
    required String bankName,
    GlobalKey? repaintBoundaryKey,
    double qrSize = 220.0,
  }) {
    return RepaintBoundary(
      key: repaintBoundaryKey,
      child: Container(
        width: 340,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF)],
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(
                                                alpha:0.1),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 24),
            // Logo với gradient
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF8B5CF6).withValues(
                                                alpha:0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.account_balance,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(height: 12),
            // Tên ngân hàng
            Text(
              bankName,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'QR Code Chuyển Tiền',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            // QR Container với scanner corners
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(
                                                alpha:0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // QR Code
                  QrImageView(
                    data: qrData,
                    version: QrVersions.auto,
                    size: qrSize,
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1F2937),
                    padding: const EdgeInsets.all(8),
                  ),
                  // Scanner corners
                  ...List.generate(4, (index) {
                    final positions = [
                      const Alignment(-1, -1), // top-left
                      const Alignment(1, -1), // top-right
                      const Alignment(-1, 1), // bottom-left
                      const Alignment(1, 1), // bottom-right
                    ];
                    return Positioned.fill(
                      child: Align(
                        alignment: positions[index],
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            border: Border(
                              top: index < 2
                                  ? const BorderSide(
                                      color: Color(0xFF6366F1),
                                      width: 3,
                                    )
                                  : BorderSide.none,
                              left: index % 2 == 0
                                  ? const BorderSide(
                                      color: Color(0xFF6366F1),
                                      width: 3,
                                    )
                                  : BorderSide.none,
                              bottom: index >= 2
                                  ? const BorderSide(
                                      color: Color(0xFF6366F1),
                                      width: 3,
                                    )
                                  : BorderSide.none,
                              right: index % 2 == 1
                                  ? const BorderSide(
                                      color: Color(0xFF6366F1),
                                      width: 3,
                                    )
                                  : BorderSide.none,
                            ),
                            borderRadius: BorderRadius.only(
                              topLeft: index == 0
                                  ? const Radius.circular(4)
                                  : Radius.zero,
                              topRight: index == 1
                                  ? const Radius.circular(4)
                                  : Radius.zero,
                              bottomLeft: index == 2
                                  ? const Radius.circular(4)
                                  : Radius.zero,
                              bottomRight: index == 3
                                  ? const Radius.circular(4)
                                  : Radius.zero,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Thông tin tài khoản
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.white, Colors.grey[50]!],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE0E7FF), width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.person_outline,
                      color: Color(0xFF6366F1),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          accountName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          accountNumber,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF6B7280),
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Divider
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 40),
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    Colors.grey[300]!,
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Footer
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.qr_code_scanner, size: 18, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Text(
                  'Quét mã QR để chuyển tiền',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Tạo bởi $_appName',
              style: TextStyle(fontSize: 11, color: Colors.grey[500]),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
