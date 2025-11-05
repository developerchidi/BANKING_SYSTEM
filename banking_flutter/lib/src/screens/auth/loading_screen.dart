import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import '../../services/card_service.dart';
import '../../services/notification_service.dart';
import '../../theme/theme_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class LoadingScreen extends StatefulWidget {
  const LoadingScreen({super.key});

  @override
  State<LoadingScreen> createState() => _LoadingScreenState();
}

class _LoadingScreenState extends State<LoadingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );

    _controller.forward();
    _loadInitialData();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    try {
      // Update theme provider with user tier
      await _updateThemeProvider();

      // Load accounts (optional, don't fail if error)
      try {
        final bankingService = BankingService(ApiClient());
        await bankingService.getAccounts(context: context);
      } catch (_) {
        // Ignore account loading errors
      }

      // Load cards (optional, don't fail if error)
      try {
        await CardService.fetchMyCards();
      } catch (_) {
        // Ignore card loading errors
      }

      // Load transactions (optional, don't fail if error)
      try {
        final bankingService = BankingService(ApiClient());
        await bankingService.getTransactions(limit: 10, offset: 0);
      } catch (_) {
        // Ignore transaction loading errors
      }

      // Connect to notification WebSocket
      try {
        final prefs = await SharedPreferences.getInstance();
        final userId = prefs.getString('userId');
        final accessToken = prefs.getString('accessToken');
        if (userId != null && accessToken != null) {
          await NotificationService().updateUserCredentials(userId, accessToken);
        }
      } catch (_) {
        // Ignore WebSocket connection errors
      }

      // Wait for animation to complete
      await Future.delayed(const Duration(milliseconds: 500));

      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/app');
      }
    } catch (e) {
      print('❌ Loading Screen: Error loading data: $e');
      // Still navigate even if some data fails to load
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/app');
      }
    }
  }

  Future<void> _updateThemeProvider() async {
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
              '🎨 Loading: Updated theme provider with tier: ${userData['accountTier']}',
            );
          }
        } catch (e) {
          print('🎨 Loading: Error updating theme: $e');
        }
      }
    } catch (e) {
      print('🎨 Loading: Error reading user data for theme: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F0F23),
              Color(0xFF1A1A2E),
              Color(0xFF0F0F23),
            ],
          ),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Progress indicator
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: SizedBox(
                    width: double.infinity,
                    child: LinearProgressIndicator(
                      backgroundColor: Colors.white.withOpacity(0.1),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        const Color(0xFFA855F7),
                      ),
                      minHeight: 4,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

