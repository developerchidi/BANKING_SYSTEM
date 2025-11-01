import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import '../../services/http_client.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      final service = AuthService(ApiClient());
      final result = await service.forgotPassword(_emailController.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result['message'] ?? '')));
      if (result['success'] == true) {
        // Điều hướng bước 2: Xác nhận mã
        Navigator.of(context).pushNamed('/verify-reset-code');
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 375;
    final isMedium = size.width >= 375 && size.width < 414;
    final isLarge = size.width >= 414 && size.width < 768;
    final isTablet = size.width >= 768 && size.width < 1024;
    final isDesktop = size.width >= 1024;

    final padding = isSmall
        ? 16.0
        : (isMedium ? 20.0 : (isLarge ? 24.0 : (isTablet ? 32.0 : 40.0)));
    final titleFont = isSmall
        ? 24.0
        : (isMedium ? 28.0 : (isLarge ? 32.0 : (isTablet ? 36.0 : 40.0)));
    final subFont = isSmall
        ? 12.0
        : (isMedium ? 14.0 : (isLarge ? 16.0 : (isTablet ? 18.0 : 20.0)));
    final formMaxWidth = isTablet
        ? 500.0
        : (isDesktop ? 600.0 : double.infinity);
    final headerSpacing = isSmall
        ? 16.0
        : (isMedium ? 20.0 : (isLarge ? 24.0 : (isTablet ? 32.0 : 40.0)));
    final submitBtnHeight = isSmall
        ? 44.0
        : (isMedium ? 48.0 : (isLarge ? 52.0 : (isTablet ? 56.0 : 60.0)));

    final borderRadius = BorderRadius.circular(20);

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.authBackground),
        child: Stack(
          children: [
            Positioned(
              top: -50,
              left: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  color: const Color(0xFFA855F7).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(1000),
                ),
              ),
            ),
            Positioned(
              top: 100,
              right: -30,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  color: const Color(0xFFFBBF24).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(1000),
                ),
              ),
            ),
            Positioned(
              bottom: 100,
              left: 50,
              child: Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  color: const Color(0xFFEC4899).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(1000),
                ),
              ),
            ),
            SafeArea(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                padding: EdgeInsets.only(
                  left: padding,
                  right: padding,
                  top: padding,
                  bottom:
                      padding + 80 + MediaQuery.of(context).viewInsets.bottom,
                ),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight:
                        MediaQuery.of(context).size.height -
                        MediaQuery.of(context).padding.top -
                        MediaQuery.of(context).padding.bottom -
                        80,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(height: headerSpacing),
                      Row(
                        children: [
                          DecoratedBox(
                            decoration: BoxDecoration(
                              color: const Color(0xFFA855F7),
                              borderRadius: BorderRadius.all(
                                Radius.circular(isSmall ? 6 : 8),
                              ),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(isSmall ? 6 : 8),
                              child: Icon(
                                Ionicons.shield_checkmark,
                                color: Colors.white,
                                size: isSmall ? 16 : 20,
                              ),
                            ),
                          ),
                          SizedBox(width: isSmall ? 8 : 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'BANKING SYSTEM',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: isSmall ? 14 : 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'Secure • Fast • Reliable',
                                style: TextStyle(
                                  color: const Color(0xB3FFFFFF),
                                  fontSize: isSmall ? 10 : 12,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      SizedBox(height: isSmall ? 24 : 32),
                      Text(
                        'Quên mật khẩu',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: titleFont,
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                      Text(
                        'Nhận mã xác nhận 6 số qua email để đặt lại mật khẩu',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: const Color(0xCCFFFFFF),
                          fontSize: subFont,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Center(
                        child: ConstrainedBox(
                          constraints: BoxConstraints(maxWidth: formMaxWidth),
                          child: ClipRRect(
                            borderRadius: borderRadius,
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.06),
                                  borderRadius: borderRadius,
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.18),
                                  ),
                                ),
                                padding: const EdgeInsets.all(16),
                                child: Form(
                                  key: _formKey,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Nhập email đã đăng ký để nhận mã xác nhận 6 số.',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      TextFormField(
                                        controller: _emailController,
                                        decoration: InputDecoration(
                                          labelText: 'Email',
                                          filled: true,
                                          fillColor: Colors.white.withOpacity(
                                            0.08,
                                          ),
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                            borderSide: BorderSide(
                                              color: Colors.white.withOpacity(
                                                0.25,
                                              ),
                                            ),
                                          ),
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                            borderSide: BorderSide(
                                              color: Colors.white.withOpacity(
                                                0.6,
                                              ),
                                              width: 1.5,
                                            ),
                                          ),
                                          labelStyle: const TextStyle(
                                            color: Colors.white,
                                          ),
                                        ),
                                        style: const TextStyle(
                                          color: Colors.white,
                                        ),
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        validator: (v) {
                                          final value = (v ?? '').trim();
                                          if (value.isEmpty)
                                            return 'Vui lòng nhập email';
                                          final emailRegex = RegExp(
                                            r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                                          );
                                          if (!emailRegex.hasMatch(value))
                                            return 'Email không hợp lệ';
                                          return null;
                                        },
                                      ),
                                      const SizedBox(height: 16),
                                      Container(
                                        height: submitBtnHeight,
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [
                                              Color(0xFFA855F7),
                                              Color(0xFF7C3AED),
                                            ],
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            16,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(
                                                0.3,
                                              ),
                                              offset: const Offset(0, 4),
                                              blurRadius: 8,
                                            ),
                                          ],
                                        ),
                                        child: ElevatedButton(
                                          onPressed: _submitting
                                              ? null
                                              : _submit,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.transparent,
                                            shadowColor: Colors.transparent,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(16),
                                            ),
                                          ),
                                          child: _submitting
                                              ? const SizedBox(
                                                  height: 20,
                                                  width: 20,
                                                  child: CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                    valueColor:
                                                        AlwaysStoppedAnimation<
                                                          Color
                                                        >(Colors.white),
                                                  ),
                                                )
                                              : const Text(
                                                  'Gửi mã xác nhận',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Center(
                                        child: TextButton(
                                          onPressed: () {
                                            Navigator.of(
                                              context,
                                            ).pushNamedAndRemoveUntil(
                                              '/login',
                                              (r) => false,
                                            );
                                          },
                                          child: const Text(
                                            'Quay lại đăng nhập',
                                            style: TextStyle(
                                              color: Color(0xFFA855F7),
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
