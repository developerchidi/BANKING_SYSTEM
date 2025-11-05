import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../models/transaction.dart';
import '../../models/account.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import '../../theme/theme_provider.dart';
import 'transaction_detail_screen.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final BankingService _bankingService = BankingService(ApiClient());
  final ScrollController _scrollController = ScrollController();
  final List<Account> _accounts = [];
  final Set<String> _myAccountIds = {};
  final Set<String> _seenTransactionNumbers = {};

  bool _loading = false;
  bool _loadingMore = false;
  String? _error;
  final List<BankTransaction> _items = [];
  int _offset = 0;
  final int _limit = 20;
  bool _endReached = false;

  // Search and filter
  String _searchQuery = '';
  String _selectedFilter = 'all';
  final TextEditingController _searchController = TextEditingController();

  // Filter options
  final List<Map<String, String>> _filterOptions = [
    {'value': 'all', 'label': 'Tất cả'},
    {'value': 'TRANSFER', 'label': 'Chuyển khoản'},
    {'value': 'DEPOSIT', 'label': 'Nạp tiền'},
    {'value': 'WITHDRAWAL', 'label': 'Rút tiền'},
    {'value': 'PAYMENT', 'label': 'Thanh toán'},
  ];

  // Group transactions by date
  Map<String, List<BankTransaction>> get _groupedTransactions {
    final filtered = _filteredTransactions;
    final Map<String, List<BankTransaction>> grouped = {};

    for (final transaction in filtered) {
      final dateKey = _formatDateKey(transaction.createdAt);
      if (!grouped.containsKey(dateKey)) {
        grouped[dateKey] = [];
      }
      grouped[dateKey]!.add(transaction);
    }

    // Sort each group by time (newest first)
    grouped.forEach((key, transactions) {
      transactions.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    });

    return grouped;
  }

  // Filter transactions based on search query and selected filter
  List<BankTransaction> get _filteredTransactions {
    List<BankTransaction> filtered = _items;

    // Apply type filter
    if (_selectedFilter != 'all') {
      filtered = filtered
          .where((transaction) => transaction.type == _selectedFilter)
          .toList();
    }

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((transaction) {
        final description = transaction.description?.toLowerCase() ?? '';
        final amount = transaction.amount.toString();
        final transactionNumber = transaction.transactionNumber.toLowerCase();
        final query = _searchQuery.toLowerCase();

        return description.contains(query) ||
            amount.contains(query) ||
            transactionNumber.contains(query);
      }).toList();
    }

    return filtered;
  }

  String _formatDateKey(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final transactionDate = DateTime(date.year, date.month, date.day);

    if (transactionDate == today) {
      return 'Hôm nay';
    } else if (transactionDate == yesterday) {
      return 'Hôm qua';
    } else {
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    }
  }

  @override
  void initState() {
    super.initState();
    _bootstrap();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        _fetchMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final accs = await _bankingService.getAccounts();
      _accounts.clear();
      _accounts.addAll(accs);
      _myAccountIds
        ..clear()
        ..addAll(accs.map((e) => e.id));

      // Update theme provider with user data
      if (mounted) {
        final prefs = await SharedPreferences.getInstance();
        final userJson = prefs.getString('user');
        if (userJson != null) {
          try {
            final userData = jsonDecode(userJson);
            final themeProvider = Provider.of<ThemeProvider>(
              context,
              listen: false,
            );
            themeProvider.updateUserTierFromUserData(userData);
            print(
              '🎨 Transactions: Updated theme provider with tier: ${userData['accountTier']}',
            );
            print(
              '🎨 Transactions: Primary color: ${themeProvider.primaryColor}',
            );
          } catch (e) {
            print('🎨 Transactions: Error updating theme: $e');
          }
        }
      }
    } catch (_) {
      // ignore account load errors (still show transactions)
    } finally {
      await _fetch();
    }
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _bankingService.getTransactions(
        limit: _limit,
        offset: _offset,
      );
      setState(() {
        _items.clear();
        _seenTransactionNumbers.clear();
        for (final t in data) {
          if (_seenTransactionNumbers.add(t.transactionNumber)) {
            _items.add(t);
          }
        }
        _endReached = data.length < _limit;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _fetchMore() async {
    if (_loadingMore || _endReached) return;
    setState(() {
      _loadingMore = true;
    });
    try {
      final nextOffset = _offset + _limit;
      final data = await _bankingService.getTransactions(
        limit: _limit,
        offset: nextOffset,
      );
      setState(() {
        _offset = nextOffset;
        for (final t in data) {
          if (_seenTransactionNumbers.add(t.transactionNumber)) {
            _items.add(t);
          }
        }
        _endReached = data.length < _limit;
      });
    } catch (_) {
      // ignore load more errors silently
    } finally {
      setState(() {
        _loadingMore = false;
      });
    }
  }

  bool _isCreditForMe(BankTransaction t) {
    if (_myAccountIds.isEmpty) return t.receiverAccountId != t.senderAccountId;
    if (t.receiverAccountId != null &&
        _myAccountIds.contains(t.receiverAccountId))
      return true;
    if (t.senderAccountId != null && _myAccountIds.contains(t.senderAccountId))
      return false;
    // fallback: if receiver account object matches one of mine
    if (t.receiverAccount != null &&
        _myAccountIds.contains(t.receiverAccount!.id))
      return true;
    if (t.senderAccount != null && _myAccountIds.contains(t.senderAccount!.id))
      return false;
    // default: treat TRANSFER as debit to be conservative
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Scaffold(
          backgroundColor: themeProvider.backgroundColor,
          appBar: AppBar(
            title: const Text('Lịch sử giao dịch'),
            backgroundColor: themeProvider.accentColor,
            foregroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
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
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(120),
              child: Column(
                children: [
                  // Search bar
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (value) {
                        setState(() {
                          _searchQuery = value;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Tìm kiếm giao dịch...',
                        hintStyle: TextStyle(color: Colors.grey[600]),
                        prefixIcon: Icon(
                          Ionicons.search_outline,
                          color: themeProvider.accentColor,
                        ),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: Icon(
                                  Ionicons.close_circle_outline,
                                  color: themeProvider.accentColor,
                                ),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = '';
                                  });
                                },
                              )
                            : null,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: themeProvider.accentColor.withValues(
                              alpha: 0.3,
                            ),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: themeProvider.accentColor.withValues(
                              alpha: 0.3,
                            ),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: themeProvider.accentColor,
                          ),
                        ),
                        filled: true,
                        fillColor: Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                  ),
                  // Filter chips
                  SizedBox(
                    height: 40,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filterOptions.length,
                      itemBuilder: (context, index) {
                        final option = _filterOptions[index];
                        final isSelected = _selectedFilter == option['value'];

                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(
                              option['label']!,
                              style: TextStyle(
                                color: isSelected
                                    ? Colors.white
                                    : themeProvider.accentColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                _selectedFilter = option['value']!;
                              });
                            },
                            selectedColor: themeProvider.accentColor.withValues(
                              alpha: 0.2,
                            ),
                            checkmarkColor: themeProvider.accentColor,
                            backgroundColor: Colors.white.withValues(
                              alpha: 0.8,
                            ),
                            side: BorderSide(
                              color: isSelected
                                  ? themeProvider.accentColor
                                  : themeProvider.accentColor.withValues(
                                      alpha: 0.3,
                                    ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              _offset = 0;
              await _fetch();
            },
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            const Icon(
                              Ionicons.alert_circle,
                              color: Color(0xFFF87171),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: const TextStyle(
                                  color: Color(0xFFF87171),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : _buildGroupedTransactions(),
          ),
        );
      },
    );
  }

  Widget _buildGroupedTransactions() {
    final grouped = _groupedTransactions;
    final sortedDates = grouped.keys.toList()
      ..sort((a, b) {
        if (a == 'Hôm nay') return -1;
        if (b == 'Hôm nay') return 1;
        if (a == 'Hôm qua') return -1;
        if (b == 'Hôm qua') return 1;
        return b.compareTo(a); // Newest dates first
      });

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: sortedDates.length + (_loadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == sortedDates.length) {
          return _buildLoadingMore();
        }

        final dateKey = sortedDates[index];
        final transactions = grouped[dateKey]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDateHeader(dateKey),
            const SizedBox(height: 12),
            ...transactions.map(
              (transaction) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: _buildTransactionCard(transaction),
              ),
            ),
            const SizedBox(height: 20),
          ],
        );
      },
    );
  }

  Widget _buildDateHeader(String dateKey) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                themeProvider.primaryColor.withValues(alpha: 0.1),
                themeProvider.secondaryColor.withValues(alpha: 0.05),
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: themeProvider.primaryColor.withValues(alpha: 0.2),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: themeProvider.primaryColor.withValues(alpha: 0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: themeProvider.primaryColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Ionicons.calendar_outline,
                  size: 18,
                  color: themeProvider.primaryColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dateKey,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: themeProvider.textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_groupedTransactions[dateKey]!.length} giao dịch',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: themeProvider.textSecondaryColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTransactionCard(BankTransaction transaction) {
    final isCredit = _isCreditForMe(transaction);
    final amountColor = _getTransactionColor(transaction);
    final icon = _getTransactionIcon(transaction);
    final status = _getTransactionStatus(transaction);
    final statusColor = _getStatusColor(transaction.status);

    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: themeProvider.surfaceColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: themeProvider.primaryColor.withValues(alpha: 0.2),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: themeProvider.primaryColor.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 5,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        TransactionDetailScreen(transaction: transaction),
                  ),
                );
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    // Transaction Icon
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: amountColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: amountColor, size: 24),
                    ),
                    const SizedBox(width: 12),
                    // Transaction Details
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            transaction.description ?? 'Giao dịch',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: themeProvider.textPrimaryColor,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  _formatDate(transaction.processedAt),
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: themeProvider.textSecondaryColor,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    status,
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w500,
                                      color: statusColor,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Amount
                    Flexible(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerRight,
                            child: Text(
                              '${isCredit ? '+' : '-'}${_formatCurrency(transaction.amount.abs())} VND',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: amountColor,
                              ),
                              textAlign: TextAlign.end,
                            ),
                          ),
                          const SizedBox(height: 4),
                          SizedBox(
                            width: double.infinity,
                            child: Text(
                              transaction.transactionNumber,
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                color: themeProvider.textSecondaryColor
                                    .withValues(alpha: 0.7),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.end,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildLoadingMore() {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(
                themeProvider.primaryColor,
              ),
            ),
          ),
        );
      },
    );
  }

  Color _getTransactionColor(BankTransaction transaction) {
    return _isCreditForMe(transaction)
        ? const Color(0xFF10B981)
        : const Color(0xFFEF4444);
  }

  IconData _getTransactionIcon(BankTransaction transaction) {
    return _isCreditForMe(transaction)
        ? Ionicons.arrow_down_circle
        : Ionicons.arrow_up_circle;
  }

  String _getTransactionStatus(BankTransaction transaction) {
    switch (transaction.status) {
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'PENDING':
        return 'Đang xử lý';
      case 'FAILED':
        return 'Thất bại';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return transaction.status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return const Color(0xFF10B981);
      case 'PENDING':
        return const Color(0xFFF59E0B);
      case 'FAILED':
        return const Color(0xFFEF4444);
      case 'CANCELLED':
        return const Color(0xFF6B7280);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String _formatCurrency(double amount) {
    final intAmount = amount.toInt();

    if (intAmount >= 1000000000) {
      final billions = intAmount ~/ 1000000000;
      final remainder = intAmount % 1000000000;

      if (remainder == 0) {
        return '${billions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.000.000.000';
      } else {
        final millions = remainder ~/ 1000000;
        final thousands = (remainder % 1000000) ~/ 1000;
        final units = remainder % 1000;

        String result =
            '${billions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.';

        if (millions > 0) {
          result += '${millions.toString().padLeft(3, '0')}.';
        } else {
          result += '000.';
        }

        if (thousands > 0) {
          result += '${thousands.toString().padLeft(3, '0')}.';
        } else {
          result += '000.';
        }

        if (units > 0) {
          result += units.toString().padLeft(3, '0');
        } else {
          result += '000';
        }

        return result;
      }
    } else if (intAmount >= 1000000) {
      final millions = intAmount ~/ 1000000;
      final remainder = intAmount % 1000000;

      if (remainder == 0) {
        return '${millions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.000.000';
      } else {
        final thousands = remainder ~/ 1000;
        final units = remainder % 1000;

        String result =
            '${millions.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.';

        if (thousands > 0) {
          result += '${thousands.toString().padLeft(3, '0')}.';
        } else {
          result += '000.';
        }

        if (units > 0) {
          result += units.toString().padLeft(3, '0');
        } else {
          result += '000';
        }

        return result;
      }
    } else if (intAmount >= 1000) {
      final thousands = intAmount ~/ 1000;
      final units = intAmount % 1000;

      if (units == 0) {
        return '${thousands.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.000';
      } else {
        return '${thousands.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}.${units.toString().padLeft(3, '0')}';
      }
    } else {
      return intAmount.toString();
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        if (difference.inMinutes == 0) {
          return 'Vừa xong';
        } else {
          return '${difference.inMinutes} phút trước';
        }
      } else {
        return '${difference.inHours} giờ trước';
      }
    } else if (difference.inDays == 1) {
      return 'Hôm qua';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else {
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    }
  }
}
