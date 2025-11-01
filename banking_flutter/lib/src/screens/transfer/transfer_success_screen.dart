import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';

class TransferSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> transactionData;
  
  const TransferSuccessScreen({
    super.key,
    required this.transactionData,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            // Compact Purple Header
            Container(
              padding: const EdgeInsets.fromLTRB(100, 24, 100, 20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFA855F7),
                    Color(0xFF9333EA),
                  ],
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(20),
                  bottomRight: Radius.circular(20),
                ),
              ),
              child: Column(
                children: [
                  // Compact Success Icon
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFA855F7).withOpacity(0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Ionicons.checkmark_circle,
                      color: Color(0xFFA855F7),
                      size: 30,
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Compact Success Title
                  const Text(
                    'Giao dịch thành công',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Compact Amount Display
                  Text(
                    _formatCurrency(transactionData['amount']),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Transaction Details Card
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFA855F7).withOpacity(0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Card Header with Icon
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFA855F7), Color(0xFF9333EA)],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Ionicons.receipt,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 16),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Chi tiết giao dịch',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF1F2937),
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Thông tin giao dịch vừa thực hiện',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF6B7280),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Transaction Details with Color Coding
                          _buildStyledRow('Mã giao dịch', _getTransactionNumber(), Ionicons.receipt_outline),
                          _buildDivider(),
                          _buildStyledRow('Người nhận', transactionData['toAccountName']?.toString() ?? 'N/A', Ionicons.person_outline),
                          _buildDivider(),
                          _buildStyledRow('Số tài khoản', transactionData['toAccountNumber']?.toString() ?? 'N/A', Ionicons.card_outline),
                          _buildDivider(),
                          _buildStyledRow('Thời gian', _formatDateTime(transactionData['createdAt'] ?? DateTime.now()), Ionicons.time_outline),
                          
                          if (transactionData['description'] != null && 
                              transactionData['description'].toString().isNotEmpty) ...[
                            _buildDivider(),
                            _buildStyledRow('Nội dung', transactionData['description'].toString(), Ionicons.document_text_outline),
                          ],
                          
                          if (transactionData['fee'] != null && transactionData['fee'] > 0) ...[
                            _buildDivider(),
                            _buildStyledRow('Phí giao dịch', _formatCurrency(transactionData['fee']), Ionicons.card_outline),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        decoration: const BoxDecoration(
          color: Color(0xFFF8FAFC),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Save Image and New Transfer Row
            Row(
              children: [
                // Save Image Button
                Expanded(
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFA855F7), width: 2),
                      color: Colors.white,
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => _saveImage(context),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Ionicons.camera_outline,
                              color: Color(0xFFA855F7),
                              size: 22,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Lưu ảnh',
                              style: TextStyle(
                                color: Color(0xFFA855F7),
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // New Transfer Button
                Expanded(
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFA855F7), Color(0xFF9333EA)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFA855F7).withOpacity(0.4),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => _newTransfer(context),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Ionicons.add_circle_outline,
                              color: Colors.white,
                              size: 22,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Chuyển khoản mới',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Back to Dashboard Button
            Container(
              width: double.infinity,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _backToDashboard(context),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Ionicons.home_outline,
                        color: Color(0xFF6B7280),
                        size: 22,
                      ),
                      SizedBox(width: 12),
                      Text(
                        'Về trang chủ',
                        style: TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStyledRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          // Icon Container - Fixed Size
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFA855F7).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: const Color(0xFFA855F7),
              size: 20,
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Label - Fixed Width
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF6B7280),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Value - Flexible Width
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF1F2937),
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.right,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 1,
      color: const Color(0xFFE5E7EB),
      margin: const EdgeInsets.symmetric(vertical: 8),
    );
  }

  String _getTransactionNumber() {
    // Try different possible field names
    final transactionNumber = transactionData['transactionNumber']?.toString() ??
                              transactionData['id']?.toString() ??
                              transactionData['transactionId']?.toString();
    
    if (transactionNumber != null && transactionNumber.isNotEmpty && transactionNumber != 'N/A') {
      return transactionNumber;
    }
    
    // Generate a temporary transaction number if none available
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    return 'GD${timestamp.substring(timestamp.length - 8)}';
  }

  String _formatCurrency(dynamic amount) {
    if (amount == null) return '0 VND';
    
    double numAmount;
    if (amount is String) {
      numAmount = double.tryParse(amount) ?? 0;
    } else if (amount is int) {
      numAmount = amount.toDouble();
    } else if (amount is double) {
      numAmount = amount;
    } else {
      numAmount = 0;
    }
    
    final formatter = NumberFormat('#,###');
    return '${formatter.format(numAmount)} VND';
  }

  String _formatDateTime(dynamic dateTime) {
    if (dateTime == null) return 'N/A';
    
    DateTime dt;
    if (dateTime is String) {
      dt = DateTime.tryParse(dateTime) ?? DateTime.now();
    } else if (dateTime is DateTime) {
      dt = dateTime;
    } else {
      dt = DateTime.now();
    }
    
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  void _saveImage(BuildContext context) {
    // TODO: Implement save image functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tính năng lưu ảnh sẽ được phát triển'),
        backgroundColor: Color(0xFFA855F7),
      ),
    );
  }

  void _newTransfer(BuildContext context) {
    // Navigate to transfer type screen
    Navigator.of(context).pushReplacementNamed('/app');
    // Then navigate to transfer tab
    // This will be handled by the main tabs screen
  }

  void _backToDashboard(BuildContext context) {
    // Navigate back to dashboard
    Navigator.of(context).pushReplacementNamed('/app');
  }
}
