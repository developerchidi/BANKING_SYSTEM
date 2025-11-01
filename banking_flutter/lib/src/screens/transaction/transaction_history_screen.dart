import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/transaction.dart';
import '../../models/account.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import 'transaction_detail_screen.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({Key? key}) : super(key: key);

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  final BankingService _bankingService = BankingService(ApiClient());
  List<BankTransaction> _transactions = [];
  List<Account> _accounts = [];
  final Set<String> _myAccountIds = {};
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';
  String _selectedFilter = 'all';
  int _currentPage = 1;
  bool _hasMoreData = true;
  final ScrollController _scrollController = ScrollController();

  // Filter options
  final List<Map<String, String>> _filterOptions = [
    {'value': 'all', 'label': 'Tất cả'},
    {'value': 'TRANSFER', 'label': 'Chuyển khoản'},
    {'value': 'DEPOSIT', 'label': 'Nạp tiền'},
    {'value': 'WITHDRAWAL', 'label': 'Rút tiền'},
    {'value': 'PAYMENT', 'label': 'Thanh toán'},
  ];

  @override
  void initState() {
    super.initState();
    _bootstrap();
    _scrollController.addListener(_onScroll);
  }

  Future<void> _bootstrap() async {
    try {
      _accounts = await _bankingService.getAccounts();
      _myAccountIds
        ..clear()
        ..addAll(_accounts.map((e) => e.id));
    } catch (_) {}
    await _loadTransactions();
  }

  bool _isCreditForMe(BankTransaction t) {
    if (_myAccountIds.isEmpty) return t.receiverAccountId != t.senderAccountId;
    if (t.receiverAccountId != null &&
        _myAccountIds.contains(t.receiverAccountId))
      return true;
    if (t.senderAccountId != null && _myAccountIds.contains(t.senderAccountId))
      return false;
    if (t.receiverAccount != null &&
        _myAccountIds.contains(t.receiverAccount!.id))
      return true;
    if (t.senderAccount != null && _myAccountIds.contains(t.senderAccount!.id))
      return false;
    return false;
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (_hasMoreData && !_isLoading) {
        _loadMoreTransactions();
      }
    }
  }

  Future<void> _loadTransactions({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMoreData = true;
        _transactions.clear();
      });
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final newTransactions = await _bankingService.getTransactions(
        offset: (_currentPage - 1) * 20,
        limit: 20,
      );

      setState(() {
        if (refresh) {
          _transactions = newTransactions;
        } else {
          _transactions.addAll(newTransactions);
        }
        _hasMoreData = newTransactions.length == 20;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreTransactions() async {
    if (_isLoading || !_hasMoreData) return;

    setState(() {
      _currentPage++;
    });

    await _loadTransactions();
  }

  List<BankTransaction> get _filteredTransactions {
    if (_searchQuery.isEmpty) return _transactions;

    return _transactions.where((transaction) {
      return (transaction.description?.toLowerCase().contains(
                _searchQuery.toLowerCase(),
              ) ??
              false) ||
          transaction.transactionNumber.toLowerCase().contains(
            _searchQuery.toLowerCase(),
          ) ||
          transaction.type.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

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
      return '${date.day}/${date.month}/${date.year}';
    }
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
      return 'Hôm nay ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Hôm qua ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Lịch sử giao dịch',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Color(0xFF1F2937)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Color(0x0F000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                // Search Bar
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value;
                      });
                    },
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm giao dịch...',
                      hintStyle: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 14,
                      ),
                      prefixIcon: const Icon(
                        Ionicons.search,
                        color: Color(0xFF64748B),
                        size: 20,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filterOptions.map((filter) {
                      final isSelected = _selectedFilter == filter['value'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(
                            filter['label']!,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFF64748B),
                            ),
                          ),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              _selectedFilter = filter['value']!;
                            });
                            _loadTransactions(refresh: true);
                          },
                          backgroundColor: const Color(0xFFF1F5F9),
                          selectedColor: const Color(0xFF6366F1),
                          checkmarkColor: Colors.white,
                          side: BorderSide(
                            color: isSelected
                                ? const Color(0xFF6366F1)
                                : const Color(0xFFE2E8F0),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          // Transactions List
          Expanded(
            child: _isLoading && _transactions.isEmpty
                ? _buildLoadingState()
                : _error != null
                ? _buildErrorState()
                : _groupedTransactions.isEmpty
                ? _buildEmptyState()
                : _buildTransactionsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Ionicons.alert_circle, size: 64, color: Color(0xFFEF4444)),
          const SizedBox(height: 16),
          Text(
            'Có lỗi xảy ra',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _error ?? 'Không thể tải dữ liệu',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: const Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => _loadTransactions(refresh: true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6366F1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: Text(
              'Thử lại',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Ionicons.receipt_outline,
            size: 64,
            color: Color(0xFF94A3B8),
          ),
          const SizedBox(height: 16),
          Text(
            'Chưa có giao dịch',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Bạn chưa có giao dịch nào trong khoảng thời gian này',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: const Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionsList() {
    final grouped = _groupedTransactions;
    final sortedDates = grouped.keys.toList()
      ..sort((a, b) {
        // Sort dates: Today first, then Yesterday, then by date
        if (a == 'Hôm nay') return -1;
        if (b == 'Hôm nay') return 1;
        if (a == 'Hôm qua') return -1;
        if (b == 'Hôm qua') return 1;
        return b.compareTo(a); // Newest dates first
      });

    return RefreshIndicator(
      onRefresh: () => _loadTransactions(refresh: true),
      color: const Color(0xFF6366F1),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: sortedDates.length + (_hasMoreData ? 1 : 0),
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
      ),
    );
  }

  Widget _buildDateHeader(String dateKey) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF6366F1).withOpacity(0.1),
            const Color(0xFF8B5CF6).withOpacity(0.05),
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF6366F1).withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withOpacity(0.1),
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
              color: const Color(0xFF6366F1).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Ionicons.calendar_outline,
              size: 18,
              color: const Color(0xFF6366F1),
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
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_groupedTransactions[dateKey]!.length} giao dịch',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingMore() {
    return const Padding(
      padding: EdgeInsets.all(16),
      child: Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
        ),
      ),
    );
  }

  Widget _buildTransactionCard(BankTransaction transaction) {
    final isCredit = _isCreditForMe(transaction);
    final amountColor = _getTransactionColor(transaction);
    final icon = _getTransactionIcon(transaction);
    final status = _getTransactionStatus(transaction);
    final statusColor = _getStatusColor(transaction.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0x0F000000),
            blurRadius: 10,
            offset: const Offset(0, 2),
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
                    color: amountColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: amountColor, size: 24),
                ),
                const SizedBox(width: 12),
                // Transaction Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        transaction.description ?? 'Giao dịch',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1E293B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            _formatDate(transaction.processedAt),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              status,
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Amount
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${isCredit ? '+' : '-'}${_formatCurrency(transaction.amount.abs())} VND',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: amountColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      transaction.transactionNumber,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
