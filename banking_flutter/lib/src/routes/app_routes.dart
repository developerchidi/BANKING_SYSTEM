import 'package:flutter/material.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/two_factor_screen.dart';
import '../screens/auth/registration_screen.dart';
import 'main_tabs.dart';
import '../screens/transaction/transactions_screen.dart';
import '../screens/kyc/kyc_capture_screen.dart';
import '../screens/kyc/kyc_storage_info_screen.dart';
import '../screens/interest/interest_screen.dart';
import '../widgets/interest_card.dart';
import '../widgets/interest_card.dart' show InterestHistoryScreen;
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/auth/verify_reset_code_screen.dart';
import '../screens/support/help_center_screen.dart';
import '../screens/cards/cards_list_screen.dart';
import '../screens/notification/notification_list_screen.dart';
import '../screens/notification/notification_detail_screen.dart';

Map<String, WidgetBuilder> buildAppRoutes() => {
  '/': (context) => const LoginScreen(),
  '/login': (context) => const LoginScreen(),
  '/registration': (context) => const RegistrationScreen(),
  '/2fa': (context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    String? studentId;
    if (args is Map && args['studentId'] is String) {
      studentId = args['studentId'] as String? ?? '';
    }
    return TwoFactorScreen(studentId: studentId);
  },
  '/app': (context) => const MainTabsScreen(),
  '/transaction': (context) {
    return const TransactionsScreen();
  },
  '/kyc-capture': (context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    Map<String, dynamic> registrationData = {};
    if (args is Map) {
      registrationData = Map<String, dynamic>.from(args);
    }
    return KYCCaptureScreen(registrationData: registrationData);
  },
  '/kyc-storage-info': (context) => const KYCStorageInfoScreen(),
  '/interest': (context) => const InterestScreen(),
  '/interest-history': (context) => const InterestHistoryScreen(),
  '/forgot-password': (context) => const ForgotPasswordScreen(),
  '/verify-reset-code': (context) => const VerifyResetCodeScreen(),
  '/reset-password': (context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    String? token;
    if (args is Map && args['token'] is String) {
      token = args['token'] as String? ?? '';
    }
    return ResetPasswordScreen(token: token);
  },
  '/help-center': (context) => const HelpCenterScreen(),
  '/cards': (context) => const CardsListScreen(),
  '/notifications': (context) => const NotificationListScreen(),
  '/notifications/:id': (context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    String? notificationId;
    if (args is Map && args['notificationId'] is String) {
      notificationId = args['notificationId'] as String? ?? '';
    } else if (args is String) {
      notificationId = args;
    }
    return NotificationDetailScreen(notificationId: notificationId ?? '');
  },
};
