import 'package:flutter/material.dart';
import '../widgets/token_expiration_modal.dart';

class TokenExpirationService {
  static bool _isModalShowing = false;

  /// Hiển thị modal token expiration
  static Future<void> showTokenExpirationModal({
    required BuildContext context,
    required VoidCallback onLoginPressed,
    VoidCallback? onCancelPressed,
  }) async {
    // Tránh hiển thị nhiều modal cùng lúc
    if (_isModalShowing) return;
    
    _isModalShowing = true;
    
    try {
      await TokenExpirationModal.show(
        context: context,
        onLoginPressed: () {
          _isModalShowing = false;
          onLoginPressed();
        },
        onCancelPressed: onCancelPressed != null ? () {
          _isModalShowing = false;
          onCancelPressed();
        } : null,
      );
    } catch (e) {
      _isModalShowing = false;
      rethrow;
    }
  }

  /// Hiển thị modal với animation
  static Future<void> showAnimatedTokenExpirationModal({
    required BuildContext context,
    required VoidCallback onLoginPressed,
    VoidCallback? onCancelPressed,
  }) async {
    if (_isModalShowing) return;
    
    _isModalShowing = true;
    
    try {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AnimatedTokenExpirationModal(
            onLoginPressed: () {
              _isModalShowing = false;
              onLoginPressed();
            },
            onCancelPressed: onCancelPressed != null ? () {
              _isModalShowing = false;
              onCancelPressed();
            } : null,
          );
        },
      );
    } catch (e) {
      _isModalShowing = false;
      rethrow;
    }
  }

  /// Reset trạng thái modal (dùng khi cần thiết)
  static void reset() {
    _isModalShowing = false;
  }
}
