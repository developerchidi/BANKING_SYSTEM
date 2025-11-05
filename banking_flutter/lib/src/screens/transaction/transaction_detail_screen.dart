import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/transaction.dart';
import '../../models/account.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import '../../theme/app_theme.dart';

class TransactionDetailScreen extends StatefulWidget {
  final BankTransaction transaction;

  const TransactionDetailScreen({Key? key, required this.transaction})
    : super(key: key);

  @override
  State<TransactionDetailScreen> createState() =>
      _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  final BankingService _bankingService = BankingService(ApiClient());
  final Set<String> _myAccountIds = {};
  bool _loadingAccounts = true;

  @override
  void initState() {
    super.initState();
    _loadAccounts();
  }

  Future<void> _loadAccounts() async {
    try {
      final accounts = await _bankingService.getAccounts(context: context);
      _myAccountIds
        ..clear()
        ..addAll(accounts.map((e) => e.id));
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _loadingAccounts = false);
    }
  }

  bool _isCreditForMe(BankTransaction t) {
    // Use the same logic as transactions_screen for consistency
    if (_myAccountIds.isEmpty) {
      // If no accounts loaded, use fallback logic
      return t.receiverAccountId != t.senderAccountId;
    }

    // Check receiver account ID first
    if (t.receiverAccountId != null &&
        _myAccountIds.contains(t.receiverAccountId!)) {
      return true; // Money coming to my account = credit
    }

    // Check sender account ID
    if (t.senderAccountId != null &&
        _myAccountIds.contains(t.senderAccountId!)) {
      return false; // Money going from my account = debit
    }

    // Fallback: check account objects
    if (t.receiverAccount != null &&
        _myAccountIds.contains(t.receiverAccount!.id)) {
      return true; // Money coming to my account = credit
    }

    if (t.senderAccount != null &&
        _myAccountIds.contains(t.senderAccount!.id)) {
      return false; // Money going from my account = debit
    }

    // Default: treat TRANSFER as debit to be conservative (same as transactions_screen)
    return false;
  }

  Color _getTransactionColor(BankTransaction transaction) {
    switch (transaction.type) {
      case 'TRANSFER':
        return transaction.amount > 0
            ? const Color(0xFF10B981)
            : const Color(0xFFEF4444);
      case 'DEPOSIT':
        return const Color(0xFF10B981);
      case 'WITHDRAWAL':
        return const Color(0xFFEF4444);
      case 'PAYMENT':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFF6B7280);
    }
  }

  IconData _getTransactionIcon(BankTransaction transaction) {
    switch (transaction.type) {
      case 'TRANSFER':
        return transaction.amount > 0
            ? Ionicons.arrow_down_circle
            : Ionicons.arrow_up_circle;
      case 'DEPOSIT':
        return Ionicons.add_circle;
      case 'WITHDRAWAL':
        return Ionicons.remove_circle;
      case 'PAYMENT':
        return Ionicons.card;
      default:
        return Ionicons.receipt;
    }
  }

  String _getTransactionType(String type) {
    switch (type) {
      case 'TRANSFER':
        return 'Chuyển khoản';
      case 'DEPOSIT':
        return 'Nạp tiền';
      case 'WITHDRAWAL':
        return 'Rút tiền';
      case 'PAYMENT':
        return 'Thanh toán';
      case 'BILL_PAYMENT':
        return 'Thanh toán hóa đơn';
      case 'CARD_PAYMENT':
        return 'Thanh toán thẻ';
      case 'LOAN_PAYMENT':
        return 'Trả nợ';
      case 'INTEREST_CREDIT':
        return 'Lãi suất';
      case 'FEE_DEBIT':
        return 'Phí dịch vụ';
      default:
        return type;
    }
  }

  String _getTransactionStatus(String status) {
    switch (status) {
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'PENDING':
        return 'Đang xử lý';
      case 'FAILED':
        return 'Thất bại';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'PROCESSING':
        return 'Đang xử lý';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return const Color(0xFF10B981);
      case 'PENDING':
      case 'PROCESSING':
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

  String _formatDateTime(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.transaction;

    // Wait for accounts to load before determining credit/debit
    if (_loadingAccounts) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          title: Text(
            'Chi tiết giao dịch',
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
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final isCredit = _isCreditForMe(t);
    final displayAmount = t.amount;
    final amountColor = isCredit
        ? const Color(0xFF10B981)
        : const Color(0xFFEF4444);
    final icon = isCredit
        ? Ionicons.arrow_down_circle
        : Ionicons.arrow_up_circle;
    final status = _getTransactionStatus(t.status);
    final statusColor = _getStatusColor(t.status);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Chi tiết giao dịch',
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Transaction Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0x0F000000),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Transaction Icon
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: amountColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(icon, color: amountColor, size: 40),
                  ),
                  const SizedBox(height: 16),
                  // Transaction Type
                  Text(
                    _getTransactionType(t.type),
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Amount
                  Text(
                    '${isCredit ? '+' : '-'}${_formatCurrency(displayAmount.abs())} VND',
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: amountColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      status,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Transaction Details Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Thông tin giao dịch',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildDetailRow('Mã giao dịch', t.transactionNumber),
                  _buildDetailRow('Mô tả', t.description ?? 'Không có mô tả'),
                  _buildDetailRow(
                    'Loại giao dịch',
                    _getTransactionType(t.type),
                  ),
                  _buildDetailRow('Trạng thái', status),
                  _buildDetailRow(
                    'Ngày thực hiện',
                    _formatDateTime(t.processedAt),
                  ),
                  // Phí giao dịch đã tắt theo yêu cầu
                  _buildDetailRow('Đơn vị tiền tệ', t.currency),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Account Information Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Thông tin tài khoản',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (t.sourceType == 'SYSTEM')
                    _buildDetailRow('Nguồn', 'Hệ thống')
                  else if (t.senderAccount != null)
                    _buildAccountRow(
                      'Tài khoản gửi',
                      t.senderAccount!.accountNumber,
                      t.senderAccount!.accountName,
                    ),
                  if (t.receiverAccount != null)
                    _buildAccountRow(
                      'Tài khoản nhận',
                      t.receiverAccount!.accountNumber,
                      t.receiverAccount!.accountName,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Additional Information Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Thông tin bổ sung',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildDetailRow('ID giao dịch', t.id),
                  _buildDetailRow('Ngày tạo', _formatDateTime(t.createdAt)),
                  if (t.updatedAt != null)
                    _buildDetailRow(
                      'Ngày cập nhật',
                      _formatDateTime(t.updatedAt!),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      // TODO: Implement share functionality
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Tính năng chia sẻ sẽ được thêm vào'),
                          backgroundColor: Color(0xFF6366F1),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF6366F1)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Ionicons.share_outline,
                          color: Color(0xFF6366F1),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Chia sẻ',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF6366F1),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      // TODO: Implement download receipt functionality
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Tính năng tải biên lai sẽ được thêm vào',
                          ),
                          backgroundColor: Color(0xFF6366F1),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Ionicons.download_outline,
                          color: Colors.white,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Tải biên lai',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: const Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF1E293B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountRow(
    String label,
    String accountNumber,
    String accountName,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: const Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  accountNumber,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  accountName,
                  style: GoogleFonts.inter(
                    fontSize: 12,
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
}
