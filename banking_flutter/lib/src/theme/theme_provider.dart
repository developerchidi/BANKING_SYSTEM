import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'fintech_theme.dart';

class ThemeProvider extends ChangeNotifier {
  UserTier _userTier = UserTier.BASIC;
  bool _isDarkMode = false;

  UserTier get userTier => _userTier;
  bool get isDarkMode => _isDarkMode;

  // Update user tier and notify listeners
  void updateUserTier(UserTier tier) {
    _userTier = tier;
    notifyListeners();
  }

  // Update user tier from string
  void updateUserTierFromString(String tierString) {
    _userTier = FintechTheme.parseTier(tierString);
    notifyListeners();
  }

  // Update user tier from user data
  void updateUserTierFromUserData(Map<String, dynamic> userData) {
    final tierString = userData['accountTier'] as String? ?? 'BASIC';
    _userTier = FintechTheme.getUserTier(userData);
    print(
      '🎨 ThemeProvider: Updated tier from "$tierString" to ${_userTier.name}',
    );
    print('🎨 ThemeProvider: Primary color: ${primaryColor}');
    notifyListeners();
  }

  // Toggle dark mode
  void toggleDarkMode() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }

  // Set dark mode
  void setDarkMode(bool isDark) {
    _isDarkMode = isDark;
    notifyListeners();
  }

  // Get current theme colors
  Color get primaryColor => FintechTheme.getPrimaryColor(_userTier);
  Color get secondaryColor => FintechTheme.getSecondaryColor(_userTier);
  Color get accentColor => FintechTheme.getAccentColor(_userTier);

  // Get current gradient
  LinearGradient get gradient => FintechTheme.getGradient(_userTier);
  LinearGradient get cardGradient => FintechTheme.getCardGradient(_userTier);

  // Get current shadow color
  Color get shadowColor => FintechTheme.getShadowColor(_userTier);

  // Get current background color
  Color get backgroundColor =>
      _isDarkMode ? FintechTheme.backgroundDark : FintechTheme.backgroundLight;

  // Get current surface color
  Color get surfaceColor =>
      _isDarkMode ? FintechTheme.surfaceDark : FintechTheme.surfaceLight;

  // Get current text color
  Color get textPrimaryColor =>
      _isDarkMode ? FintechTheme.textLight : FintechTheme.textPrimary;

  Color get textSecondaryColor => _isDarkMode
      ? FintechTheme.textLight.withOpacity(0.7)
      : FintechTheme.textSecondary;

  // Get current card decoration
  BoxDecoration get cardDecoration => FintechTheme.getCardDecoration(_userTier);
  BoxDecoration get glassCardDecoration =>
      FintechTheme.getGlassCardDecoration(_userTier);

  // Get current text styles
  TextStyle get headingStyle => FintechTheme.getHeadingStyle(_userTier);
  TextStyle get subheadingStyle => FintechTheme.getSubheadingStyle(_userTier);
  TextStyle get bodyStyle =>
      FintechTheme.getBodyStyle().copyWith(color: textPrimaryColor);
  TextStyle get captionStyle =>
      FintechTheme.getCaptionStyle().copyWith(color: textSecondaryColor);

  // Get tier info
  String get tierDisplayName => FintechTheme.getTierDisplayName(_userTier);
  String get tierVietnameseName =>
      FintechTheme.getTierVietnameseName(_userTier);
  IconData get tierIcon => FintechTheme.getTierIcon(_userTier);

  // Gold Metallic Colors - Fixed colors for consistent design
  static const Color goldMetallicPrimary = Color(
    0xFFB8860B,
  ); // Dark Goldenrod - sáng nhất
  static const Color goldMetallicSecondary = Color(
    0xFFDAA520,
  ); // Goldenrod - sáng nhất
  static const Color goldMetallicAccent = Color(
    0xFF8B6914,
  ); // Darker Goldenrod - tối nhất

  // Gold Metallic Gradients
  static const LinearGradient goldMetallicGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      goldMetallicAccent, // Darker Goldenrod - tối nhất
      goldMetallicPrimary, // Dark Goldenrod - sáng nhất
      goldMetallicSecondary, // Goldenrod - sáng nhất
    ],
    stops: [0.0, 0.5, 1.0],
  );

  // Gold Metallic Shadows
  static List<BoxShadow> get goldMetallicShadow => [
    BoxShadow(
      color: goldMetallicAccent.withValues(alpha: 0.4),
      blurRadius: 20,
      offset: const Offset(0, 10),
    ),
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.3),
      blurRadius: 10,
      offset: const Offset(0, 5),
    ),
  ];

  // Gold Metallic Card Decoration
  static BoxDecoration get goldMetallicCardDecoration => BoxDecoration(
    gradient: goldMetallicGradient,
    borderRadius: BorderRadius.circular(20),
    boxShadow: goldMetallicShadow,
  );
}

// Theme extension for easy access
extension ThemeExtension on BuildContext {
  ThemeProvider get themeProvider =>
      Provider.of<ThemeProvider>(this, listen: false);
  ThemeProvider get themeProviderWatch => Provider.of<ThemeProvider>(this);
}
