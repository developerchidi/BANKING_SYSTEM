import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color primary = Color(0xFF6366F1); // #6366f1
  static const Color primaryDark = Color(0xFF4F46E5); // #4f46e5
  static const Color primaryBlue = Color(0xFF2563EB); // #2563eb
  static const Color purple = Color(0xFF8B5CF6); // #8b5cf6
  static const Color success = Color(0xFF10B981); // #10b981
  static const Color warning = Color(0xFFF59E0B); // #f59e0b
  static const Color danger = Color(0xFFEF4444); // #ef4444
  static const Color slate900 = Color(0xFF0F172A); // #0f172a
  static const Color slate800 = Color(0xFF1E293B); // #1e293b
  static const Color slate700 = Color(0xFF334155); // #334155
  static const Color slate300 = Color(0xFFCBD5E1); // #cbd5e1
  static const Color indigo200 = Color(0xFFA5B4FC); // #a5b4fc
  static const Color offWhite = Color(0xFFF5F7FB);
}

class AppTheme {
  static ThemeData light() {
    final base = ThemeData(useMaterial3: true);
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.primaryBlue,
      tertiary: AppColors.purple,
      brightness: Brightness.light,
    );

    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: Colors.white,
      textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
        titleLarge: GoogleFonts.inter(fontWeight: FontWeight.w700),
        bodyMedium: GoogleFonts.inter(),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(44),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
      cardTheme: const CardThemeData(
        margin: EdgeInsets.zero,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: AppColors.primary.withOpacity(0.12),
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class AppGradients {
  static const LinearGradient authBackground = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0F172A), Color(0xFF7C3AED), Color(0xFF0F172A)],
  );
}
