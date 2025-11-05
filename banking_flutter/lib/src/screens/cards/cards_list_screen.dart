import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../services/card_service.dart';
import 'package:flutter/services.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import '../../models/account.dart';
import '../../theme/theme_provider.dart';
import '../../providers/auth_provider.dart';

String _formatCardHolderName(String? holder) {
  if (holder == null || holder.isEmpty) {
    return 'CHU THE';
  }

  // Convert to uppercase and remove Vietnamese diacritics
  String normalized = holder.toUpperCase();
  normalized = normalized
      .replaceAll('À', 'A')
      .replaceAll('Á', 'A')
      .replaceAll('Ạ', 'A')
      .replaceAll('Ả', 'A')
      .replaceAll('Ã', 'A')
      .replaceAll('Â', 'A')
      .replaceAll('Ầ', 'A')
      .replaceAll('Ấ', 'A')
      .replaceAll('Ậ', 'A')
      .replaceAll('Ẩ', 'A')
      .replaceAll('Ẫ', 'A')
      .replaceAll('Ă', 'A')
      .replaceAll('Ằ', 'A')
      .replaceAll('Ắ', 'A')
      .replaceAll('Ặ', 'A')
      .replaceAll('Ẳ', 'A')
      .replaceAll('Ẵ', 'A')
      .replaceAll('È', 'E')
      .replaceAll('É', 'E')
      .replaceAll('Ẹ', 'E')
      .replaceAll('Ẻ', 'E')
      .replaceAll('Ẽ', 'E')
      .replaceAll('Ê', 'E')
      .replaceAll('Ề', 'E')
      .replaceAll('Ế', 'E')
      .replaceAll('Ệ', 'E')
      .replaceAll('Ể', 'E')
      .replaceAll('Ễ', 'E')
      .replaceAll('Ì', 'I')
      .replaceAll('Í', 'I')
      .replaceAll('Ị', 'I')
      .replaceAll('Ỉ', 'I')
      .replaceAll('Ĩ', 'I')
      .replaceAll('Ò', 'O')
      .replaceAll('Ó', 'O')
      .replaceAll('Ọ', 'O')
      .replaceAll('Ỏ', 'O')
      .replaceAll('Õ', 'O')
      .replaceAll('Ô', 'O')
      .replaceAll('Ồ', 'O')
      .replaceAll('Ố', 'O')
      .replaceAll('Ộ', 'O')
      .replaceAll('Ổ', 'O')
      .replaceAll('Ỗ', 'O')
      .replaceAll('Ơ', 'O')
      .replaceAll('Ờ', 'O')
      .replaceAll('Ớ', 'O')
      .replaceAll('Ợ', 'O')
      .replaceAll('Ở', 'O')
      .replaceAll('Ỡ', 'O')
      .replaceAll('Ù', 'U')
      .replaceAll('Ú', 'U')
      .replaceAll('Ụ', 'U')
      .replaceAll('Ủ', 'U')
      .replaceAll('Ũ', 'U')
      .replaceAll('Ư', 'U')
      .replaceAll('Ừ', 'U')
      .replaceAll('Ứ', 'U')
      .replaceAll('Ự', 'U')
      .replaceAll('Ử', 'U')
      .replaceAll('Ữ', 'U')
      .replaceAll('Ỳ', 'Y')
      .replaceAll('Ý', 'Y')
      .replaceAll('Ỵ', 'Y')
      .replaceAll('Ỷ', 'Y')
      .replaceAll('Ỹ', 'Y')
      .replaceAll('Đ', 'D');

  return normalized;
}

class CardsListScreen extends StatefulWidget {
  const CardsListScreen({super.key});

  @override
  State<CardsListScreen> createState() => _CardsListScreenState();
}

class _CardsListScreenState extends State<CardsListScreen> {
  late Future<List<CardDto>> _future;

  @override
  void initState() {
    super.initState();
    _future = CardService.fetchMyCards();
    _updateThemeFromUserData();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Update theme provider when screen becomes active
    _updateThemeFromUserData();
  }

  // Update theme provider with user tier from SharedPreferences
  Future<void> _updateThemeFromUserData() async {
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
              '🎨 Cards: Updated theme provider with tier: ${userData['accountTier']}',
            );
          }
        } catch (e) {
          print('🎨 Cards: Error updating theme: $e');
        }
      }
    } catch (e) {
      print('🎨 Cards: Error reading user data for theme: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Scaffold(
          backgroundColor: themeProvider.backgroundColor,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
            elevation: 0,
            flexibleSpace: Container(
              decoration: BoxDecoration(
                gradient: themeProvider.gradient,
                boxShadow: [
                  BoxShadow(
                    color: themeProvider.shadowColor,
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
            ),
            title: const Text('Thẻ của tôi'),
            actions: [
              IconButton(
                onPressed: _openIssueCardDialog,
                icon: const Icon(Icons.add_card_outlined),
                tooltip: 'Phát hành thẻ',
              ),
            ],
          ),
          body: FutureBuilder<List<CardDto>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return _ErrorState(
                  message: 'Không tải được danh sách thẻ',
                  detail: snapshot.error.toString(),
                  onRetry: () {
                    setState(() {
                      _future = CardService.fetchMyCards();
                    });
                  },
                );
              }
              final cards = snapshot.data ?? [];
              if (cards.isEmpty) {
                return _EmptyState(
                  title: 'Chưa có thẻ',
                  subtitle: 'Bạn chưa có thẻ nào được phát hành',
                  onCreate: _openIssueCardDialog,
                );
              }
              final listView = ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: cards.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final card = cards[index];
                  final isLocked = !card.isActive || card.isBlocked;
                  return InkWell(
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(20),
                          ),
                        ),
                        builder: (_) => _CardDetailSheet(
                          card: card,
                          onUpdated: () {
                            if (mounted) {
                              setState(() {
                                _future = CardService.fetchMyCards();
                              });
                            }
                          },
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: themeProvider.gradient,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: themeProvider.shadowColor,
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
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.3),
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  card.brand,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: themeProvider.accentColor,
                                    fontWeight: FontWeight.w700,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black.withValues(
                                          alpha: 0.3,
                                        ),
                                        blurRadius: 1,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                isLocked ? 'Đã khóa' : 'Đang hoạt động',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isLocked
                                      ? const Color(0xFFFF6B6B)
                                      : const Color(0xFF4CAF50),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            card.masked,
                            style: TextStyle(
                              fontSize: 20,
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              shadows: [
                                Shadow(
                                  color: themeProvider.shadowColor,
                                  blurRadius: 2,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Consumer<AuthProvider>(
                            builder: (context, authProvider, child) {
                              final firstName = authProvider.user?['firstName'];
                              final lastName = authProvider.user?['lastName'];
                              final email = authProvider.user?['email'];
                              final userName =
                                  firstName != null && lastName != null
                                  ? '$firstName $lastName'
                                  : email ?? 'CHU THE';
                              return Text(
                                _formatCardHolderName(userName),
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.white.withValues(alpha: 0.8),
                                  fontWeight: FontWeight.w600,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
              return RefreshIndicator(
                onRefresh: () async {
                  setState(() {
                    _future = CardService.fetchMyCards();
                  });
                  await _future;
                },
                color: themeProvider.accentColor,
                backgroundColor: Colors.white.withValues(alpha: 0.9),
                child: listView,
              );
            },
          ),
        );
      },
    );
  }

  void _openIssueCardDialog() {
    showDialog(
      context: context,
      builder: (context) => _IssueCardDialog(
        onIssued: (card) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Phát hành thẻ thành công')),
          );
          setState(() {
            _future = CardService.fetchMyCards();
          });
        },
      ),
    );
  }
}

class _CardDetailSheet extends StatefulWidget {
  final CardDto card;
  final VoidCallback? onUpdated;
  const _CardDetailSheet({required this.card, this.onUpdated});

  @override
  State<_CardDetailSheet> createState() => _CardDetailSheetState();
}

class _CardDetailSheetState extends State<_CardDetailSheet> {
  bool _showFull = false;

  @override
  Widget build(BuildContext context) {
    final masked = widget.card.masked;
    final full = widget.card.fullNumber ?? '';
    final brand = widget.card.brand;
    final holder = widget.card.holder;
    final isLocked = !widget.card.isActive || widget.card.isBlocked;

    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Container(
          decoration: BoxDecoration(
            color: themeProvider.backgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              top: 12,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 38,
                    height: 4,
                    decoration: BoxDecoration(
                      color: themeProvider.accentColor.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _showFull && full.isNotEmpty ? full : masked,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: themeProvider.textPrimaryColor,
                    shadows: [
                      Shadow(
                        color: themeProvider.accentColor.withValues(alpha: 0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    final firstName = authProvider.user?['firstName'];
                    final lastName = authProvider.user?['lastName'];
                    final email = authProvider.user?['email'];
                    final userName = firstName != null && lastName != null
                        ? '$firstName $lastName'
                        : email ?? 'CHU THE';
                    return Text(
                      '$brand • ${_formatCardHolderName(userName)}',
                      style: TextStyle(
                        color: themeProvider.textSecondaryColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                // Card limits section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        themeProvider.surfaceColor,
                        themeProvider.surfaceColor.withOpacity(0.8),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: themeProvider.accentColor.withValues(alpha: 0.5),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: themeProvider.accentColor.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Hạn mức hiện tại',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: themeProvider.accentColor,
                          fontSize: 18,
                          shadows: [
                            Shadow(
                              color: themeProvider.shadowColor,
                              blurRadius: 2,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildLimitRow('Giao dịch/ngày', widget.card.dailyLimit),
                      _buildLimitRow(
                        'Giao dịch/tháng',
                        widget.card.monthlyLimit,
                      ),
                      _buildLimitRow('ATM/ngày', widget.card.atmDailyLimit),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          setState(() => _showFull = !_showFull);
                        },
                        icon: Icon(
                          _showFull
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                        ),
                        label: Text(_showFull ? 'Ẩn số thẻ' : 'Hiện số thẻ'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: themeProvider.accentColor,
                          side: BorderSide(
                            color: themeProvider.accentColor,
                            width: 2,
                          ),
                          backgroundColor: Colors.white.withValues(alpha: 0.1),
                          shape: const StadiumBorder(),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 2,
                          shadowColor: themeProvider.accentColor.withValues(
                            alpha: 0.2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          final text = _showFull && full.isNotEmpty
                              ? full
                              : masked;
                          Clipboard.setData(ClipboardData(text: text));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Đã sao chép số thẻ')),
                          );
                        },
                        icon: const Icon(Icons.copy_all_outlined),
                        label: const Text('Sao chép'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: themeProvider.accentColor,
                          side: BorderSide(
                            color: themeProvider.accentColor,
                            width: 2,
                          ),
                          backgroundColor: Colors.white.withValues(alpha: 0.1),
                          shape: const StadiumBorder(),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 2,
                          shadowColor: themeProvider.accentColor.withValues(
                            alpha: 0.2,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: themeProvider.gradient,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: themeProvider.shadowColor,
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
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      try {
                        String? reason;
                        if (!isLocked) {
                          reason = await _promptBlockReason(context);
                          if (reason == null || reason.trim().isEmpty) {
                            return;
                          }
                        }
                        final updated = await CardService.setCardBlock(
                          cardId: widget.card.id,
                          block: !isLocked,
                          reason: reason?.trim(),
                        );
                        if (!mounted) return;
                        Navigator.pop(context);
                        widget.onUpdated?.call();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              updated.isBlocked
                                  ? 'Đã khóa thẻ'
                                  : 'Đã mở khóa thẻ',
                            ),
                          ),
                        );
                      } catch (e) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Thao tác thất bại: $e')),
                        );
                      }
                    },
                    icon: Icon(isLocked ? Icons.lock_open : Icons.lock_outline),
                    label: Text(isLocked ? 'Mở khóa thẻ' : 'Khóa thẻ'),
                    style:
                        ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          foregroundColor: Colors.white,
                          shape: const StadiumBorder(),
                          minimumSize: const Size.fromHeight(48),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                        ).copyWith(
                          overlayColor: MaterialStateProperty.all(
                            Colors.transparent,
                          ),
                        ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLimitRow(String label, int? limit) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: themeProvider.textSecondaryColor,
                  fontSize: 14,
                ),
              ),
              Text(
                limit != null ? _formatCurrency(limit) : 'Chưa thiết lập',
                style: TextStyle(
                  color: limit != null
                      ? themeProvider.textPrimaryColor
                      : themeProvider.textSecondaryColor.withOpacity(0.6),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatCurrency(int amount) {
    if (amount >= 1000000000) {
      return '${(amount / 1000000000).toStringAsFixed(1)}B VND';
    } else if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(0)}M VND';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}K VND';
    }
    return '$amount VND';
  }
}

Future<String?> _promptBlockReason(BuildContext context) async {
  final extraCtrl = TextEditingController();
  String? selected = 'Nghi ngờ giao dịch bất thường';
  final choices = <String>[
    'Nghi ngờ giao dịch bất thường',
    'Mất thẻ',
    'Cho mượn thẻ và muốn tạm khóa',
    'Khác',
  ];

  return showDialog<String>(
    context: context,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Lý do khóa thẻ'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final c in choices)
                  RadioListTile<String>(
                    value: c,
                    groupValue: selected,
                    onChanged: (v) => setState(() => selected = v),
                    title: Text(c),
                    contentPadding: EdgeInsets.zero,
                  ),
                const SizedBox(height: 8),
                TextField(
                  controller: extraCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Mô tả thêm (không bắt buộc)',
                    hintText: 'Ví dụ: phát hiện giao dịch lúc 10:20... ',
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () {
                final base = selected ?? '';
                final extra = extraCtrl.text.trim();
                final reason = extra.isNotEmpty ? '$base — $extra' : base;
                Navigator.pop(ctx, reason.trim());
              },
              child: const Text('Xác nhận'),
            ),
          ],
        ),
      );
    },
  );
}

class _EmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onCreate;
  const _EmptyState({
    required this.title,
    required this.subtitle,
    required this.onCreate,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.credit_card, size: 56, color: Color(0xFFB2BEC3)),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF636E72)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onCreate,
              child: const Text('Phát hành thẻ'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final String? detail;
  final VoidCallback onRetry;
  const _ErrorState({
    required this.message,
    this.detail,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56, color: Color(0xFFE74C3C)),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            if (detail != null) ...[
              const SizedBox(height: 6),
              Text(
                detail!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF636E72)),
              ),
            ],
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }
}

class _IssueCardDialog extends StatefulWidget {
  final void Function(CardDto card) onIssued;
  const _IssueCardDialog({required this.onIssued});

  @override
  State<_IssueCardDialog> createState() => _IssueCardDialogState();
}

class _IssueCardDialogState extends State<_IssueCardDialog> {
  String _cardType = 'DEBIT';
  final TextEditingController _pinCtrl = TextEditingController();
  bool _submitting = false;
  bool _loadingAccounts = true;
  List<Account> _accounts = const [];
  String? _selectedAccountId;

  @override
  void initState() {
    super.initState();
    _loadAccounts();
  }

  Future<void> _loadAccounts() async {
    try {
      final api = BankingService(ApiClient());
      final list = await api.getAccounts();
      if (!mounted) return;
      setState(() {
        _accounts = list;
        _selectedAccountId = list.isNotEmpty ? list.first.id : null;
        _loadingAccounts = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingAccounts = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không tải được danh sách tài khoản: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Phát hành thẻ mới'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _loadingAccounts
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: LinearProgressIndicator(minHeight: 3),
                )
              : DropdownButtonFormField<String>(
                  value: _selectedAccountId,
                  isExpanded: true,
                  items: _accounts
                      .map(
                        (a) => DropdownMenuItem(
                          value: a.id,
                          child: Text(
                            '${a.accountName} • ${a.accountNumber}',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _selectedAccountId = v),
                  decoration: const InputDecoration(
                    labelText: 'Chọn tài khoản',
                  ),
                ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _cardType,
            items: const [
              DropdownMenuItem(
                value: 'DEBIT',
                child: Text('Thẻ ghi nợ (DEBIT)'),
              ),
              DropdownMenuItem(
                value: 'CREDIT',
                child: Text('Thẻ tín dụng (CREDIT)'),
              ),
              DropdownMenuItem(
                value: 'VIRTUAL',
                child: Text('Thẻ ảo (VIRTUAL)'),
              ),
            ],
            onChanged: (v) => setState(() => _cardType = v ?? 'DEBIT'),
            decoration: const InputDecoration(labelText: 'Loại thẻ'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _pinCtrl,
            keyboardType: TextInputType.number,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'PIN (4-6 số)'),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.pop(context),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Phát hành'),
        ),
      ],
    );
  }

  Future<void> _submit() async {
    final accountId = _selectedAccountId ?? '';
    final pin = _pinCtrl.text.trim();
    if (accountId.isEmpty || pin.length < 4 || pin.length > 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập Account ID và PIN 4-6 số')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final card = await CardService.issueCard(
        accountId: accountId,
        cardType: _cardType,
        pin: pin,
      );
      widget.onIssued(card);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Phát hành thất bại: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}
