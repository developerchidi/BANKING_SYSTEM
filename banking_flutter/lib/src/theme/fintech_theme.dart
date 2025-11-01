import 'package:flutter/material.dart';
import 'theme_provider.dart';

enum UserTier { BASIC, STANDARD, PREMIUM, VIP }

class FintechTheme {
  // Fintech Color Palette - Tier-based System
  static const Map<UserTier, Color> primaryColors = {
    UserTier.BASIC: Color(0xFF7C3AED), // Medium Purple - sáng nhất
    UserTier.STANDARD: Color(0xFF6B7280), // Gray - Standard
    UserTier.PREMIUM: ThemeProvider
        .goldMetallicPrimary, // Goldenrod - sáng hơn cho gold metallic
    UserTier.VIP: ThemeProvider.goldMetallicPrimary, // Gold - sáng nhất cho VIP
  };

  static const Map<UserTier, Color> secondaryColors = {
    UserTier.BASIC: Color(0xFFA855F7), // Light Purple - sáng nhất
    UserTier.STANDARD: Color(0xFF9CA3AF), // Light Gray
    UserTier.PREMIUM: ThemeProvider.goldMetallicSecondary, // Dark Goldenrod
    UserTier.VIP: ThemeProvider.goldMetallicSecondary, // Goldenrod
  };

  static const Map<UserTier, Color> accentColors = {
    UserTier.BASIC: Color(0xFF5B21B6), // Dark Purple - tối nhất
    UserTier.STANDARD: Color(0xFF4B5563), // Medium Gray
    UserTier.PREMIUM:
        ThemeProvider.goldMetallicAccent, // Dark Goldenrod - tối nhất
    UserTier.VIP:
        ThemeProvider.goldMetallicAccent, // Dark Goldenrod - tối nhất cho VIP
  };

  // Neutral Colors - Dark Fintech Theme
  static const Color backgroundLight = Color(0xFF1A1A1A); // Dark background
  static const Color backgroundDark = Color(0xFF0D0D0D); // Darker background
  static const Color surfaceLight = Color(0xFF2A2A2A); // Dark surface
  static const Color surfaceDark = Color(0xFF1F1F1F); // Darker surface
  static const Color textPrimary = Color(0xFFFFFFFF); // Pure white text
  static const Color textSecondary = Color(0xFFE0E0E0); // Light gray text
  static const Color textLight = Color(0xFFFFFFFF); // White text

  // Glassmorphism Colors - Gold Theme
  static const Color glassBackground = Color(0x1AFFD700); // Gold glass
  static const Color glassBorder = Color(0x33FFD700); // Gold border

  // Get theme colors for specific tier
  static Color getPrimaryColor(UserTier tier) => primaryColors[tier]!;
  static Color getSecondaryColor(UserTier tier) => secondaryColors[tier]!;
  static Color getAccentColor(UserTier tier) => accentColors[tier]!;

  // Get gradient for specific tier (Background chính - subtle)
  static LinearGradient getGradient(UserTier tier) {
    return LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: [
        getPrimaryColor(tier), // Màu sáng ở bên trái
        getSecondaryColor(tier), // Màu trung bình ở giữa
        getAccentColor(tier), // Màu tối ở bên phải
      ],
      stops: const [0.0, 0.5, 1.0],
    );
  }

  // Get prominent gradient for badges (VIP Badge - nổi bật)
  static LinearGradient getProminentGradient(UserTier tier) {
    return LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: [
        getPrimaryColor(tier).withValues(alpha: 0.9), // Sáng hơn
        getSecondaryColor(tier).withValues(alpha: 0.8), // Trung bình
        getAccentColor(
          tier,
        ).withValues(alpha: 0.7), // Tối hơn nhưng vẫn nổi bật
      ],
      stops: const [0.0, 0.5, 1.0],
    );
  }

  // Get card gradient for specific tier
  static LinearGradient getCardGradient(UserTier tier) {
    return LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: [
        getPrimaryColor(tier).withValues(alpha: 0.15), // Màu sáng ở bên trái
        getSecondaryColor(tier).withValues(alpha: 0.1), // Màu trung bình ở giữa
        getAccentColor(tier).withValues(alpha: 0.05), // Màu tối ở bên phải
      ],
      stops: const [0.0, 0.5, 1.0],
    );
  }

  // Get shadow color for specific tier
  static Color getShadowColor(UserTier tier) {
    return getPrimaryColor(tier).withValues(alpha: 0.3);
  }

  // Get tier display name
  static String getTierDisplayName(UserTier tier) {
    switch (tier) {
      case UserTier.BASIC:
        return 'BASIC';
      case UserTier.STANDARD:
        return 'STANDARD';
      case UserTier.PREMIUM:
        return 'PREMIUM';
      case UserTier.VIP:
        return 'VIP';
    }
  }

  // Get tier Vietnamese name
  static String getTierVietnameseName(UserTier tier) {
    switch (tier) {
      case UserTier.BASIC:
        return 'Cơ bản';
      case UserTier.STANDARD:
        return 'Tiêu chuẩn';
      case UserTier.PREMIUM:
        return 'Cao cấp';
      case UserTier.VIP:
        return 'VIP';
    }
  }

  // Get tier icon
  static IconData getTierIcon(UserTier tier) {
    switch (tier) {
      case UserTier.BASIC:
        return Icons.circle;
      case UserTier.STANDARD:
        return Icons.star;
      case UserTier.PREMIUM:
        return Icons.diamond;
      case UserTier.VIP:
        return Icons.workspace_premium;
    }
  }

  // Parse tier from string
  static UserTier parseTier(String tierString) {
    switch (tierString.toUpperCase()) {
      case 'BASIC':
        return UserTier.BASIC;
      case 'STANDARD':
        return UserTier.STANDARD;
      case 'PREMIUM':
        return UserTier.PREMIUM;
      case 'VIP':
        return UserTier.VIP;
      default:
        return UserTier.BASIC;
    }
  }

  // Get tier from user data
  static UserTier getUserTier(Map<String, dynamic> userData) {
    final tierString = userData['accountTier'] as String? ?? 'BASIC';
    return parseTier(tierString);
  }

  // Common fintech styles - Gold Metallic Theme
  static BoxDecoration getCardDecoration(UserTier tier) {
    return BoxDecoration(
      color: surfaceLight,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: getPrimaryColor(tier).withValues(alpha: 0.3),
        width: 1.5,
      ),
      boxShadow: [
        BoxShadow(
          color: getPrimaryColor(tier).withValues(alpha: 0.2),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.3),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  static BoxDecoration getGlassCardDecoration(UserTier tier) {
    return BoxDecoration(
      color: glassBackground,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: getPrimaryColor(tier).withValues(alpha: 0.4),
        width: 1.5,
      ),
      boxShadow: [
        BoxShadow(
          color: getPrimaryColor(tier).withValues(alpha: 0.3),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.4),
          blurRadius: 15,
          offset: const Offset(0, 6),
        ),
      ],
    );
  }

  static TextStyle getHeadingStyle(UserTier tier) {
    return TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.bold,
      color: Colors.white, // Pure white for contrast
      shadows: [
        Shadow(
          color: Colors.black.withValues(alpha: 0.8),
          blurRadius: 6,
          offset: const Offset(0, 3),
        ),
        Shadow(
          color: getPrimaryColor(tier).withValues(alpha: 0.3),
          blurRadius: 4,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }

  static TextStyle getSubheadingStyle(UserTier tier) {
    return TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: Colors.white, // Pure white for contrast
      shadows: [
        Shadow(
          color: Colors.black.withValues(alpha: 0.6),
          blurRadius: 3,
          offset: const Offset(0, 1),
        ),
      ],
    );
  }

  static TextStyle getBodyStyle() {
    return const TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.normal,
      color: Color(0xFFFFFFFF), // Pure white
    );
  }

  static TextStyle getCaptionStyle() {
    return const TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      color: Color(0xFFE0E0E0), // Light gray
    );
  }
}
