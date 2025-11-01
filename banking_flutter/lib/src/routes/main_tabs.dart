import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:salomon_bottom_bar/salomon_bottom_bar.dart';
import 'package:animations/animations.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/transaction/transactions_screen.dart';
import '../screens/transfer/transfer_type_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/cards/cards_list_screen.dart';
import '../services/auth_service.dart';
import '../theme/theme_provider.dart';
import 'package:provider/provider.dart';

class MainTabsScreen extends StatefulWidget {
  const MainTabsScreen({super.key});

  @override
  State<MainTabsScreen> createState() => _MainTabsScreenState();
}

class _MainTabsScreenState extends State<MainTabsScreen> {
  int _index = 0;

  late final List<Widget> _pages = <Widget>[
    const DashboardScreen(),
    const TransactionsScreen(),
    const TransferTypeScreen(),
    const CardsListScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    AuthService.isAuthenticated.addListener(_checkAuth);
  }

  @override
  void dispose() {
    AuthService.isAuthenticated.removeListener(_checkAuth);
    super.dispose();
  }

  void _checkAuth() {
    if (!AuthService.isAuthenticated.value && mounted) {
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Scaffold(
          extendBody: true,
          backgroundColor: themeProvider.backgroundColor,
          body: PageTransitionSwitcher(
            transitionBuilder: (child, animation, secondaryAnimation) =>
                SharedAxisTransition(
                  animation: animation,
                  secondaryAnimation: secondaryAnimation,
                  transitionType: SharedAxisTransitionType.horizontal,
                  child: child,
                ),
            child: _pages[_index],
          ),
          bottomNavigationBar: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        themeProvider.primaryColor.withValues(alpha: 0.15),
                        themeProvider.secondaryColor.withValues(alpha: 0.1),
                        themeProvider.accentColor.withValues(alpha: 0.05),
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: themeProvider.primaryColor.withValues(
                          alpha: 0.2,
                        ),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: SalomonBottomBar(
                    currentIndex: _index,
                    onTap: (i) => setState(() => _index = i),
                    items: [
                      SalomonBottomBarItem(
                        icon: const Icon(CupertinoIcons.house),
                        activeIcon: const Icon(CupertinoIcons.house_fill),
                        title: const Text('Trang chủ'),
                        selectedColor: themeProvider.primaryColor,
                        unselectedColor: themeProvider.textSecondaryColor,
                      ),
                      SalomonBottomBarItem(
                        icon: const Icon(CupertinoIcons.list_bullet),
                        activeIcon: const Icon(CupertinoIcons.list_bullet),
                        title: const Text('Giao dịch'),
                        selectedColor: themeProvider.primaryColor,
                        unselectedColor: themeProvider.textSecondaryColor,
                      ),
                      SalomonBottomBarItem(
                        icon: const Icon(CupertinoIcons.arrow_right_arrow_left),
                        activeIcon: const Icon(
                          CupertinoIcons.arrow_right_arrow_left,
                        ),
                        title: const Text('Chuyển tiền'),
                        selectedColor: themeProvider.primaryColor,
                        unselectedColor: themeProvider.textSecondaryColor,
                      ),
                      SalomonBottomBarItem(
                        icon: const Icon(CupertinoIcons.creditcard),
                        activeIcon: const Icon(CupertinoIcons.creditcard_fill),
                        title: const Text('Thẻ'),
                        selectedColor: themeProvider.primaryColor,
                        unselectedColor: themeProvider.textSecondaryColor,
                      ),
                      SalomonBottomBarItem(
                        icon: const Icon(CupertinoIcons.person),
                        activeIcon: const Icon(CupertinoIcons.person_fill),
                        title: const Text('Tài khoản'),
                        selectedColor: themeProvider.primaryColor,
                        unselectedColor: themeProvider.textSecondaryColor,
                      ),
                    ],
                    backgroundColor: Colors.transparent,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
