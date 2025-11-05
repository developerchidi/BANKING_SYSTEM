import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:ionicons/ionicons.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import 'two_factor_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _studentIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 375;
    final isMedium = size.width >= 375 && size.width < 414;
    final isLarge = size.width >= 414 && size.width < 768;
    final isTablet = size.width >= 768 && size.width < 1024;
    final isDesktop = size.width >= 1024;

    // Responsive values
    final padding = isSmall
        ? 16.0
        : (isMedium ? 20.0 : (isLarge ? 24.0 : (isTablet ? 32.0 : 40.0)));
    final titleFont = isSmall
        ? 24.0
        : (isMedium ? 28.0 : (isLarge ? 32.0 : (isTablet ? 36.0 : 40.0)));
    final subFont = isSmall
        ? 12.0
        : (isMedium ? 14.0 : (isLarge ? 16.0 : (isTablet ? 18.0 : 20.0)));
    final loginBtnHeight = isSmall
        ? 44.0
        : (isMedium ? 48.0 : (isLarge ? 52.0 : (isTablet ? 56.0 : 60.0)));
    final formMaxWidth = isTablet
        ? 500.0
        : (isDesktop ? 600.0 : double.infinity);
    final headerSpacing = isSmall
        ? 16.0
        : (isMedium ? 20.0 : (isLarge ? 24.0 : (isTablet ? 32.0 : 40.0)));

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.authBackground),
        child: RepaintBoundary(
          child: Stack(
            children: [
              // Decorative blobs
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
              // Main content
              SafeArea(
                child: SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  padding: EdgeInsets.only(
                    left: padding,
                    right: padding,
                    top: padding,
                    bottom:
                        padding +
                        80 +
                        MediaQuery.of(context)
                            .viewInsets
                            .bottom, // Padding + version info + bàn phím
                  ),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight:
                          MediaQuery.of(context).size.height -
                          MediaQuery.of(context).padding.top -
                          MediaQuery.of(context).padding.bottom -
                          80, // Chỉ trừ đi chiều cao của version info
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(height: headerSpacing),
                        // Header brand
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
                                  'CHIDI BANK',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: isSmall ? 14 : 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'Bảo mật • Nhanh chóng • Tin cậy',
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
                        // Welcome title
                        // Text(
                        //   'Chào mừng đã đến với',
                        //   textAlign: TextAlign.center,
                        //   style: TextStyle(
                        //     color: Colors.white,
                        //     fontSize: titleFont,
                        //     fontWeight: FontWeight.w300,
                        //   ),
                        // ),
                        Text(
                          'Chidi BANK',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: const Color(0xFFA855F7),
                            fontSize: titleFont + (isSmall ? 16 : 20),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: isSmall ? 12 : 16),
                        Text(
                          'Trải nghiệm ngân hàng số hiện đại với hệ thống bảo mật và giao diện thân thiện.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: const Color(0xCCFFFFFF),
                            fontSize: subFont,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Features section (vertical list like RN)
                        Column(
                          children: const [
                            _FeatureItem(
                              icon: Ionicons.shield_checkmark,
                              color: Color(0xFF10B981),
                              text: 'Bảo mật ngân hàng cấp cao',
                            ),
                            SizedBox(height: 16),
                            _FeatureItem(
                              icon: Ionicons.headset,
                              color: Color(0xFF3B82F6),
                              text: 'Hỗ trợ khách hàng 24/7',
                            ),
                            SizedBox(height: 16),
                            _FeatureItem(
                              icon: Ionicons.time,
                              color: Color(0xFF8B5CF6),
                              text: 'Theo dõi giao dịch thời gian thực',
                            ),
                          ],
                        ),
                        SizedBox(height: isSmall ? 20 : 24),
                        // Form container with responsive max width
                        Center(
                          child: ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: formMaxWidth),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.06),
                                borderRadius: BorderRadius.circular(
                                  isSmall ? 10 : 12,
                                ),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.08),
                                ),
                              ),
                              child: Padding(
                                padding: EdgeInsets.all(isSmall ? 16 : 20),
                                child: Form(
                                  key: _formKey,
                                  child: Column(
                                    children: [
                                      if (auth.error != null) ...[
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: const Color(
                                              0xFFFCA5A5,
                                            ).withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                            border: Border.all(
                                              color: const Color(
                                                0xFFFCA5A5,
                                              ).withOpacity(0.3),
                                            ),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.error_outline,
                                                color: Color(0xFFFCA5A5),
                                                size: 20,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  auth.error!,
                                                  style: const TextStyle(
                                                    color: Color(0xFFFCA5A5),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                      ],
                                      // Student ID Input
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Mã số sinh viên',
                                            style: TextStyle(
                                              color: Color(0xE6FFFFFF),
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Container(
                                            decoration: BoxDecoration(
                                              color: const Color(0x1AFFFFFF),
                                              borderRadius:
                                                  BorderRadius.circular(16),
                                              border: Border.all(
                                                color: const Color(0x33FFFFFF),
                                              ),
                                            ),
                                            child: TextFormField(
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 16,
                                              ),
                                              controller: _studentIdController,
                                              keyboardType: TextInputType.text,
                                              textInputAction:
                                                  TextInputAction.next,
                                              decoration: const InputDecoration(
                                                hintText:
                                                    'Nhập mã số sinh viên',
                                                hintStyle: TextStyle(
                                                  color: Color(0x80FFFFFF),
                                                ),
                                                prefixIcon: Icon(
                                                  Ionicons.card_outline,
                                                  color: Color(0x80FFFFFF),
                                                  size: 20,
                                                ),
                                                border: InputBorder.none,
                                                contentPadding:
                                                    EdgeInsets.symmetric(
                                                      horizontal: 16,
                                                      vertical: 12,
                                                    ),
                                              ),
                                              validator: (v) =>
                                                  (v == null || v.isEmpty)
                                                  ? 'Vui lòng nhập mã số sinh viên'
                                                  : null,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      // Password Input (local rebuild only to avoid full-page flicker)
                                      StatefulBuilder(
                                        builder: (context, innerSetState) {
                                          return Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              const Text(
                                                'Mật khẩu',
                                                style: TextStyle(
                                                  color: Color(0xE6FFFFFF),
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                              const SizedBox(height: 8),
                                              Container(
                                                decoration: BoxDecoration(
                                                  color: const Color(
                                                    0x1AFFFFFF,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(16),
                                                  border: Border.all(
                                                    color: const Color(
                                                      0x33FFFFFF,
                                                    ),
                                                  ),
                                                ),
                                                child: TextFormField(
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 16,
                                                  ),
                                                  controller:
                                                      _passwordController,
                                                  textInputAction:
                                                      TextInputAction.done,
                                                  onFieldSubmitted: (_) {
                                                    if (_formKey.currentState
                                                            ?.validate() ??
                                                        false) {
                                                      auth.login(
                                                        _studentIdController
                                                            .text,
                                                        _passwordController
                                                            .text,
                                                      );
                                                    }
                                                  },
                                                  decoration: InputDecoration(
                                                    hintText:
                                                        'Nhập mật khẩu của bạn',
                                                    hintStyle: const TextStyle(
                                                      color: Color(0x80FFFFFF),
                                                    ),
                                                    prefixIcon: const Icon(
                                                      Ionicons
                                                          .lock_closed_outline,
                                                      color: Color(0x80FFFFFF),
                                                      size: 20,
                                                    ),
                                                    suffixIcon: IconButton(
                                                      onPressed: () =>
                                                          innerSetState(() {
                                                            _showPassword =
                                                                !_showPassword;
                                                          }),
                                                      icon: Icon(
                                                        _showPassword
                                                            ? Ionicons
                                                                  .eye_outline
                                                            : Ionicons
                                                                  .eye_off_outline,
                                                        color: const Color(
                                                          0x80FFFFFF,
                                                        ),
                                                        size: 20,
                                                      ),
                                                    ),
                                                    border: InputBorder.none,
                                                    contentPadding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 16,
                                                          vertical: 12,
                                                        ),
                                                  ),
                                                  obscureText: !_showPassword,
                                                  validator: (v) =>
                                                      (v == null || v.isEmpty)
                                                      ? 'Vui lòng nhập mật khẩu'
                                                      : null,
                                                ),
                                              ),
                                            ],
                                          );
                                        },
                                      ),
                                      const SizedBox(height: 8),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton(
                                          onPressed: () {
                                            Navigator.of(
                                              context,
                                            ).pushNamed('/forgot-password');
                                          },
                                          child: const Text(
                                            'Quên mật khẩu?',
                                            style: TextStyle(
                                              color: Color(0xFFA855F7),
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      // Sign In Button
                                      Container(
                                        height: loginBtnHeight,
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
                                          onPressed: auth.loading
                                              ? null
                                              : () async {
                                                  if (_formKey.currentState!
                                                      .validate()) {
                                                    await context
                                                        .read<AuthProvider>()
                                                        .login(
                                                          _studentIdController
                                                              .text
                                                              .trim(),
                                                          _passwordController
                                                              .text,
                                                        );
                                                    if (mounted &&
                                                        context
                                                            .read<
                                                              AuthProvider
                                                            >()
                                                            .requiresTwoFactor) {
                                                      if (!mounted) return;
                                                      Navigator.of(
                                                        context,
                                                      ).pushReplacement(
                                                        MaterialPageRoute(
                                                          builder: (context) =>
                                                              TwoFactorScreen(
                                                                studentId:
                                                                    _studentIdController
                                                                        .text
                                                                        .trim(),
                                                              ),
                                                        ),
                                                      );
                                                    } else if (mounted &&
                                                        context
                                                                .read<
                                                                  AuthProvider
                                                                >()
                                                                .user !=
                                                            null) {
                                                      // Update AuthService with login success
                                                      final user = context
                                                          .read<AuthProvider>()
                                                          .user;
                                                      if (user != null) {
                                                        await AuthService.setLoginState(
                                                          context
                                                                  .read<
                                                                    AuthProvider
                                                                  >()
                                                                  .accessToken ??
                                                              '',
                                                          user.toString(),
                                                        );
                                                      }
                                                      // Navigate to loading screen first, then to main app
                                                      if (mounted) {
                                                        Navigator.of(
                                                          context,
                                                        ).pushReplacementNamed(
                                                          '/loading',
                                                        );
                                                      }
                                                    }
                                                  }
                                                },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.transparent,
                                            shadowColor: Colors.transparent,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(16),
                                            ),
                                          ),
                                          child: auth.loading
                                              ? const SizedBox(
                                                  height: 22,
                                                  width: 22,
                                                  child:
                                                      CircularProgressIndicator(
                                                        strokeWidth: 2,
                                                        color: Colors.white,
                                                      ),
                                                )
                                              : const Text(
                                                  'Đăng nhập',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Wrap(
                                        alignment: WrapAlignment.center,
                                        spacing: 4,
                                        children: [
                                          const Text(
                                            "Chưa có tài khoản?",
                                            style: TextStyle(
                                              color: Color(0xB3FFFFFF),
                                              fontSize: 14,
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () {
                                              Navigator.pushNamed(
                                                context,
                                                '/registration',
                                              );
                                            },
                                            child: const Text(
                                              'Đăng ký',
                                              style: TextStyle(
                                                color: Color(0xFFA855F7),
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
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
                        SizedBox(height: isSmall ? 20 : 24),
                      ],
                    ),
                  ),
                ),
              ),
              // Version info - Fixed at bottom (không bị ảnh hưởng bởi bàn phím)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  color: Colors.transparent,
                  child: SafeArea(
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: padding,
                        vertical: isSmall ? 12 : 16,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Version 1.0.0',
                            style: TextStyle(
                              color: const Color(0x99FFFFFF),
                              fontSize: isSmall ? 10 : 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(height: isSmall ? 2 : 4),
                          Text(
                            '© 2025 Chidi Bank. All rights reserved.',
                            style: TextStyle(
                              color: const Color(0x80FFFFFF),
                              fontSize: isSmall ? 9 : 11,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String text;
  const _FeatureItem({
    required this.icon,
    required this.color,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: Color(0xCCFFFFFF), fontSize: 14),
          ),
        ),
      ],
    );
  }
}
