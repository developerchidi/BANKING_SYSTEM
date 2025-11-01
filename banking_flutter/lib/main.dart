import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'src/providers/auth_provider.dart';
import 'src/services/auth_service.dart';
import 'src/services/http_client.dart';
import 'src/services/notification_service.dart';
import 'src/routes/app_routes.dart';
import 'src/theme/app_theme.dart';
import 'src/theme/theme_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  print('🚀 Banking App: Starting application...');

  // Initialize notification service
  await NotificationService().initialize();
  print('🔔 Banking App: Notification service initialized');

  // Initialize authentication service
  await AuthService.initialize();
  print('🔐 Banking App: Authentication service initialized');

  // Use bundled fonts to avoid runtime fetching on devices (prevents missing text)
  GoogleFonts.config.allowRuntimeFetching = false;
  print('🎨 Banking App: Fonts configured');

  // Set up error handling
  ErrorWidget.builder = (FlutterErrorDetails details) {
    return Material(
      color: const Color(0xFF0F0F23),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 64),
              const SizedBox(height: 20),
              const Text(
                'Đã xảy ra lỗi',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Vui lòng thử lại sau',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 30),
              ElevatedButton(
                onPressed: () {
                  // Restart app or navigate to home
                  print('🔄 Banking App: Restarting app...');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFA855F7),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 30,
                    vertical: 15,
                  ),
                ),
                child: const Text(
                  'Thử lại',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  };

  print('🚀 Banking App: Running app...');
  runApp(const BankingApp());
}

class BankingApp extends StatelessWidget {
  const BankingApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(AuthService(ApiClient())),
        ),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: MaterialApp(
        title: 'Banking System',
        theme: AppTheme.light(),
        debugShowCheckedModeBanner: false,
        locale: const Locale('vi'),
        supportedLocales: const [Locale('vi'), Locale('en')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        builder: (context, child) {
          final mq = MediaQuery.of(context);
          // Chống vỡ layout khi người dùng đặt cỡ chữ/quy mô hiển thị lớn
          final clampedTextScale = mq.textScaleFactor.clamp(0.9, 1.15);
          final clampedScale = mq.devicePixelRatio;
          return MediaQuery(
            data: mq.copyWith(
              textScaleFactor: clampedTextScale,
              devicePixelRatio: clampedScale,
            ),
            child: child ?? const SizedBox.shrink(),
          );
        },
        routes: buildAppRoutes(),
      ),
    );
  }
}
