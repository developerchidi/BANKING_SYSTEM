import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:ionicons/ionicons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';
import '../../services/http_client.dart';
import 'dart:convert';
import '../../theme/app_theme.dart';

class TwoFactorScreen extends StatefulWidget {
  final String? studentId;
  const TwoFactorScreen({super.key, this.studentId});

  @override
  State<TwoFactorScreen> createState() => _TwoFactorScreenState();
}

class _TwoFactorScreenState extends State<TwoFactorScreen> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;
  bool _loading = false;
  bool _resendLoading = false;
  String? _error;
  String? _success;
  String? _maskedEmail;

  @override
  void initState() {
    super.initState();
    _controllers = List<TextEditingController>.generate(
      6,
      (index) => TextEditingController(),
    );
    _focusNodes = List<FocusNode>.generate(6, (index) => FocusNode());
    // Defer API call to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initMaskedEmail();
      _sendCode();
    });
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var focusNode in _focusNodes) {
      focusNode.dispose();
    }
    super.dispose();
  }

  Future<void> _sendCode() async {
    setState(() {
      _error = null;
      _success = null;
    });
    try {
      await context.read<AuthProvider>().sendTwoFactorCode();
      setState(() {
        _success = 'Đã gửi mã xác thực đến email!';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    }
  }

  void _initMaskedEmail() {
    try {
      final user = context.read<AuthProvider>().user;
      String? email;
      if (user is Map<String, dynamic>) {
        final e = user['email'];
        if (e is String && e.contains('@')) email = e;
      }
      if (email != null) {
        setState(() {
          _maskedEmail = _maskEmail(email!);
        });
      } else {
        // Try to get email from SharedPreferences first (from login response)
        _getEmailFromPrefs();
      }
    } catch (_) {
      setState(() {
        _maskedEmail = null;
      });
    }
  }

  Future<void> _getEmailFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (userJson != null) {
        final user = jsonDecode(userJson) as Map<String, dynamic>;
        final email = user['email'] as String?;
        if (email != null && email.contains('@') && mounted) {
          setState(() {
            _maskedEmail = _maskEmail(email);
          });
          return;
        }
      }
      // Fallback to API call
      _fetchEmailFromMe();
    } catch (_) {
      _fetchEmailFromMe();
    }
  }

  Future<void> _fetchEmailFromMe() async {
    try {
      final api = ApiClient();
      final resp = await api.get('/api/auth/me');
      if (resp.statusCode == 200) {
        final data = resp.body;
        // Try to parse and find email key
        String? email;
        try {
          final json = jsonDecode(data);
          final user = (json['data'] ?? json['user']) as Map<String, dynamic>?;
          email = user != null ? user['email'] as String? : null;
        } catch (_) {
          final match = RegExp(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
          ).firstMatch(data);
          if (match != null) email = match.group(0);
        }
        if (email != null && mounted) {
          setState(() {
            _maskedEmail = _maskEmail(email!);
          });
        }
      }
    } catch (_) {}
  }

  String _maskEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) return email;
    final local = parts[0];
    final domain = parts[1];

    String maskLocal(String s) {
      if (s.isEmpty) return s;
      final buffer = StringBuffer();
      // keep first visible char
      buffer.write(s[0]);
      for (int i = 1; i < s.length; i++) {
        final ch = s[i];
        if (ch == '.') {
          buffer.write('.');
        } else {
          buffer.write('*');
        }
      }
      // attempt to make last segment after last dot more obfuscated with **
      final lastDot = buffer.toString().lastIndexOf('.');
      if (lastDot >= 0 && lastDot < buffer.length - 1) {
        final prefix = buffer.toString().substring(0, lastDot + 1);
        return '$prefix**';
      }
      return buffer.toString();
    }

    String maskDomain(String s) {
      final labels = s.split('.');
      final maskedLabels = <String>[];
      for (final label in labels) {
        if (label.isEmpty) {
          maskedLabels.add('');
        } else if (label.length == 1) {
          maskedLabels.add(label);
        } else {
          maskedLabels.add(label[0] + ('*' * (label.length - 1)));
        }
      }
      return maskedLabels.join('.');
    }

    return '${maskLocal(local)}@${maskDomain(domain)}';
  }

  void _handleChange(int index, String value) {
    if (value.length > 1) return;
    _controllers[index].text = value;
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
  }

  Future<void> _handleSubmit() async {
    final code = _controllers.map((c) => c.text).join('');
    if (code.length != 6) {
      setState(() {
        _error = 'Vui lòng nhập đủ 6 số';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });

    try {
      await context.read<AuthProvider>().completeTwoFactorLogin(code);
      
      // Update AuthService with login success
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        await AuthService.setLoginState(
          context.read<AuthProvider>().accessToken ?? '',
          user.toString(),
        );
      }
      
      // Navigate to loading screen first, then to main app
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/loading');
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
      for (var controller in _controllers) {
        controller.clear();
      }
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _handleResend() async {
    setState(() {
      _resendLoading = true;
      _error = null;
      _success = null;
    });
    
    try {
      await context.read<AuthProvider>().sendTwoFactorCode();
      setState(() {
        _success = 'Đã gửi lại mã xác thực!';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _resendLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 375;
    final padding = isSmall ? 16.0 : 24.0;
    final titleFont = isSmall ? 24.0 : 32.0;
    final subFont = isSmall ? 12.0 : 16.0;
    final buttonHeight = isSmall ? 44.0 : 48.0;
    final headerSpacing = isSmall ? 16.0 : 24.0;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.authBackground),
        child: RepaintBoundary(
          child: Stack(
            children: [
              // Decorative blobs (smaller than login)
              Positioned(
                top: -30,
                left: -30,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFFA855F7).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(1000),
                  ),
                ),
              ),
              Positioned(
                top: 50,
                right: -20,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBBF24).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(1000),
                  ),
                ),
              ),
              Positioned(
                bottom: 50,
                left: 30,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEC4899).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(1000),
                  ),
                ),
              ),
              // Main content
              SafeArea(
                child: SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  padding: EdgeInsets.symmetric(horizontal: padding),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight:
                          MediaQuery.of(context).size.height -
                          MediaQuery.of(context).padding.top -
                          MediaQuery.of(context).padding.bottom,
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
                        // Welcome title
                        Text(
                          'Two-Factor',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: titleFont,
                            fontWeight: FontWeight.w300,
                          ),
                        ),
                        Text(
                          'Authentication',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: const Color(0xFFA855F7),
                            fontSize: titleFont + (isSmall ? 2 : 4),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: isSmall ? 12 : 16),
                        Text(
                          'Enter the 6-digit code sent to your email for secure access.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: const Color(0xCCFFFFFF),
                            fontSize: subFont,
                            height: 1.5,
                          ),
                        ),
                        SizedBox(height: isSmall ? 20 : 24),
                        // Form container
                        Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 500),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(
                                  isSmall ? 16 : 24,
                                ),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.2),
                                ),
                              ),
                              child: Padding(
                                padding: EdgeInsets.all(isSmall ? 16 : 20),
                                child: Column(
                                  children: [
                                    // Error/Success messages
                                    if (_error != null) ...[
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(
                                            0xFFFCA5A5,
                                          ).withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(
                                            12,
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
                                              Ionicons.alert_circle,
                                              color: Color(0xFFFCA5A5),
                                              size: 18,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                _error!,
                                                style: const TextStyle(
                                                  color: Color(0xFFFCA5A5),
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 20),
                                    ],
                                    if (_success != null) ...[
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(
                                            0xFF86EFAC,
                                          ).withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: const Color(
                                              0xFF86EFAC,
                                            ).withOpacity(0.3),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Ionicons.checkmark_circle,
                                              color: Color(0xFF86EFAC),
                                              size: 18,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                _success!,
                                                style: const TextStyle(
                                                  color: Color(0xFF86EFAC),
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
              ),
              const SizedBox(height: 20),
                                    ],
                                    // Email display
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 16,
                                        horizontal: 20,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.08),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: Colors.white.withOpacity(0.1),
                                          width: 1,
                                        ),
                                      ),
                                      child: Column(
                                        children: [
                                          const Text(
                                            'Code sent to email:',
                                            style: TextStyle(
                                              color: Color(0x99FFFFFF),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            _maskedEmail ??
                                                'your-email@***.***',
                                            style: const TextStyle(
                                              color: Colors.white, 
                                              fontSize: 15, 
                                              fontWeight: FontWeight.w600,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                    // OTP Input
                                    Column(
                                      children: [
                                        const Text(
                                          'Enter 6-digit code',
                                          style: TextStyle(
                                            color: Color(0xE6FFFFFF),
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceEvenly,
                                          children: List.generate(6, (index) {
                                            return Flexible(
                                              child: Container(
                                                margin: EdgeInsets.symmetric(
                                                  horizontal: 2,
                                                ),
                                                child: AspectRatio(
                                                  aspectRatio: 0.8,
                                                  child: TextFormField(
                                                    controller:
                                                        _controllers[index],
                                                    focusNode:
                                                        _focusNodes[index],
                                                    keyboardType:
                                                        TextInputType.number,
                                                    maxLength: 1,
                                                    textAlign: TextAlign.center,
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: isSmall
                                                          ? 18
                                                          : 22,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                    decoration: InputDecoration(
                                                      counterText: '',
                                                      hintText: '•',
                                                      hintStyle: TextStyle(
                                                        color: Colors.white
                                                            .withOpacity(0.3),
                                                      ),
                                                      filled: true,
                                                      fillColor: Colors.white
                                                          .withOpacity(0.1),
                                                      border: OutlineInputBorder(
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              isSmall ? 10 : 12,
                                                            ),
                                                        borderSide: BorderSide(
                                                          color: Colors.white
                                                              .withOpacity(0.3),
                                                          width: 2,
                                                        ),
                                                      ),
                                                      enabledBorder:
                                                          OutlineInputBorder(
                                                            borderRadius:
                                                                BorderRadius.circular(
                                                                  isSmall
                                                                      ? 10
                                                                      : 12,
                                                                ),
                                                            borderSide: BorderSide(
                                                              color: Colors
                                                                  .white
                                                                  .withOpacity(
                                                                    0.3,
                                                                  ),
                                                              width: 2,
                                                            ),
                                                          ),
                                                      focusedBorder:
                                                          OutlineInputBorder(
                                                            borderRadius:
                                                                BorderRadius.circular(
                                                                  isSmall
                                                                      ? 10
                                                                      : 12,
                                                                ),
                                                            borderSide: BorderSide(
                                                              color:
                                                                  const Color(
                                                                    0xFFA855F7,
                                                                  ),
                                                              width: 2,
                                                            ),
                                                          ),
                                                    ),
                                                    onChanged: (value) =>
                                                        _handleChange(
                                                          index,
                                                          value,
                                                        ),
                                                    onFieldSubmitted: (value) {
                                                      if (index < 5) {
                                                        _focusNodes[index + 1]
                                                            .requestFocus();
                                                      } else {
                                                        _handleSubmit();
                                                      }
                                                    },
                                                  ),
                                                ),
                                              ),
                                            );
                                          }),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 32),
                                    // Buttons
                                    Column(
                                      children: [
                                        // Verify Button
                                        Container(
                                          height: buttonHeight,
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [
                                                Color(0xFFA855F7),
                                                Color(0xFF7C3AED),
                                              ],
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              isSmall ? 12 : 16,
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
                                            onPressed: _loading
                                                ? null
                                                : _handleSubmit,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor:
                                                  Colors.transparent,
                                              shadowColor: Colors.transparent,
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(
                                                      isSmall ? 12 : 16,
                                                    ),
                                              ),
                                            ),
                                            child: _loading
                                                ? Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .center,
                                                    children: const [
                                                      SizedBox(
                                                        height: 20,
                                                        width: 20,
                                                        child:
                                                            CircularProgressIndicator(
                                                              strokeWidth: 2,
                                                              color:
                                                                  Colors.white,
                                                            ),
                                                      ),
                                                      SizedBox(width: 8),
                                                      Text(
                                                        'Verifying...',
                                                        style: TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                        ),
                                                      ),
                                                    ],
                                                  )
                                                : const Text(
                                                    'Verify Code',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        // Resend Button
                                        Container(
                                          height: buttonHeight,
                                          decoration: BoxDecoration(
                                            color: Colors.transparent,
                                            borderRadius: BorderRadius.circular(
                                              isSmall ? 12 : 16,
                                            ),
                                            border: Border.all(
                                              color: const Color(0xFFA855F7),
                                              width: 2,
                                            ),
                                          ),
                                          child: ElevatedButton(
                                            onPressed: _resendLoading
                                                ? null
                                                : _handleResend,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor:
                                                  Colors.transparent,
                                              shadowColor: Colors.transparent,
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(
                                                      isSmall ? 12 : 16,
                                                    ),
                                              ),
                                            ),
                                            child: _resendLoading
                                                ? Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .center,
                                                    children: const [
                                                      SizedBox(
                                                        height: 20,
                                                        width: 20,
                                                        child:
                                                            CircularProgressIndicator(
                                                              strokeWidth: 2,
                                                              color: Color(
                                                                0xFFA855F7,
                                                              ),
                                                            ),
                                                      ),
                                                      SizedBox(width: 8),
                                                      Text(
                                                        'Sending...',
                                                        style: TextStyle(
                                                          color: Color(
                                                            0xFFA855F7,
                                                          ),
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                        ),
                                                      ),
                                                    ],
                                                  )
                                                : const Text(
                                                    'Resend Code',
                                                    style: TextStyle(
                                                      color: Color(0xFFA855F7),
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        // Back Button (align left, subtle styling like RN)
                                        Align(
                                          alignment: Alignment.centerLeft,
                                          child: TextButton.icon(
                                            onPressed: () => Navigator.of(
                                              context,
                                            ).pushReplacementNamed('/'),
                                            icon: const Icon(
                                              Ionicons.arrow_back,
                                              color: Color(0xB3FFFFFF),
                                              size: 20,
                                            ),
                                            label: const Text(
                                              'Back to Login',
                                              style: TextStyle(
                                                color: Color(0xB3FFFFFF),
                                                fontSize: 16,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            style: TextButton.styleFrom(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 12,
                                                  ),
                                              overlayColor: Colors.white24,
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
                        SizedBox(height: isSmall ? 20 : 24),
                      ],
                    ),
                  ),
                ),
              ),
              // Version info - Fixed at bottom
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: padding,
                      vertical: isSmall ? 12 : 16,
                    ),
                    child: Column(
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
                          '© 2025 Banking System. All rights reserved.',
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
            ],
          ),
        ),
      ),
    );
  }
}
