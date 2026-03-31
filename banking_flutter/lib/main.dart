import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'src/providers/auth_provider.dart';
import 'src/services/auth_service.dart';
import 'src/services/http_client.dart';
import 'src/services/notification_service.dart';
import 'src/routes/app_routes.dart';
import 'src/theme/app_theme.dart';
import 'src/theme/theme_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (kDebugMode) {
    debugPrint('Banking App: starting');
  }

  // Initialize notification service
  await NotificationService().initialize();
  if (kDebugMode) {
    debugPrint('Banking App: notifications initialized');
  }

  // Initialize authentication service
  await AuthService.initialize();
  if (kDebugMode) {
    debugPrint('Banking App: auth initialized');
  }

  // Enable runtime fetching for Google Fonts (fonts will be downloaded if not in assets)
  // For production, consider bundling fonts in assets for better performance
  GoogleFonts.config.allowRuntimeFetching = true;

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
                  color: Colors.white.withValues(alpha: 0.7),
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

  if (kDebugMode) {
    debugPrint('Banking App: runApp');
  }
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
      child: Builder(
        builder: (context) {
          return _ThemeInitializer(
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
              routes: buildAppRoutes(),
            ),
          );
        },
      ),
    );
  }
}

// Widget để khởi tạo theme provider với user data khi app khởi động
class _ThemeInitializer extends StatefulWidget {
  const _ThemeInitializer({required this.child});
  
  final Widget child;

  @override
  State<_ThemeInitializer> createState() => _ThemeInitializerState();
}

class _ThemeInitializerState extends State<_ThemeInitializer> {
  @override
  void initState() {
    super.initState();
    _initializeTheme();
  }

  Future<void> _initializeTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (userJson != null && userJson.isNotEmpty) {
        try {
          final userData = jsonDecode(userJson);
          if (mounted) {
            final themeProvider = Provider.of<ThemeProvider>(
              context,
              listen: false,
            );
            themeProvider.updateUserTierFromUserData(userData);
            print(
              '🎨 Main: Initialized theme provider with tier: ${userData['accountTier']}',
            );
          }
        } catch (e) {
          print('🎨 Main: Error parsing user data for theme: $e');
        }
      }
    } catch (e) {
      print('🎨 Main: Error initializing theme: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Builder(
      builder: (context) {
        final mq = MediaQuery.of(context);
        // Chống vỡ layout khi người dùng đặt cỡ chữ/quy mô hiển thị lớn
        final clampedTextScale = mq.textScaleFactor.clamp(0.9, 1.15);
        final clampedScale = mq.devicePixelRatio;
        return MediaQuery(
          data: mq.copyWith(
            textScaleFactor: clampedTextScale,
            devicePixelRatio: clampedScale,
          ),
          child: widget.child,
        );
      },
    );
  }
}
