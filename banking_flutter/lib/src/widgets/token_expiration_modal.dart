import 'package:flutter/material.dart';

class TokenExpirationModal extends StatelessWidget {
  final VoidCallback onLoginPressed;
  final VoidCallback? onCancelPressed;

  const TokenExpirationModal({
    super.key,
    required this.onLoginPressed,
    this.onCancelPressed,
  });

  static Future<void> show({
    required BuildContext context,
    required VoidCallback onLoginPressed,
    VoidCallback? onCancelPressed,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // Không cho phép đóng bằng cách tap outside
      builder: (BuildContext context) {
        return TokenExpirationModal(
          onLoginPressed: onLoginPressed,
          onCancelPressed: onCancelPressed,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      elevation: 20,
      backgroundColor: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF8F9FA),
              Color(0xFFE9ECEF),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon với animation
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFFF6B6B),
                      Color(0xFFEE5A52),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFF6B6B).withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.lock_outline,
                  color: Colors.white,
                  size: 40,
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Title
              const Text(
                'Phiên đăng nhập đã hết hạn',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              // Description
              const Text(
                'Để bảo mật tài khoản của bạn, vui lòng đăng nhập lại để tiếp tục sử dụng dịch vụ.',
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF7F8C8D),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Action buttons
              Row(
                children: [
                  // Cancel button (optional)
                  if (onCancelPressed != null) ...[
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          onCancelPressed?.call();
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          side: const BorderSide(
                            color: Color(0xFFBDC3C7),
                            width: 1.5,
                          ),
                        ),
                        child: const Text(
                          'Hủy',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF7F8C8D),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],
                  
                  // Login button
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        onLoginPressed();
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        backgroundColor: const Color(0xFF3498DB),
                        foregroundColor: Colors.white,
                        elevation: 3,
                        shadowColor: const Color(0xFF3498DB).withOpacity(0.3),
                      ),
                      child: const Text(
                        'Đăng nhập lại',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Animation wrapper để tạo hiệu ứng fade in
class AnimatedTokenExpirationModal extends StatefulWidget {
  final VoidCallback onLoginPressed;
  final VoidCallback? onCancelPressed;

  const AnimatedTokenExpirationModal({
    super.key,
    required this.onLoginPressed,
    this.onCancelPressed,
  });

  @override
  State<AnimatedTokenExpirationModal> createState() => _AnimatedTokenExpirationModalState();
}

class _AnimatedTokenExpirationModalState extends State<AnimatedTokenExpirationModal>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 0.8,
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
      curve: Curves.easeOut,
    ));

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: TokenExpirationModal(
              onLoginPressed: widget.onLoginPressed,
              onCancelPressed: widget.onCancelPressed,
            ),
          ),
        );
      },
    );
  }
}