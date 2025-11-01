import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import '../../models/account.dart';
import '../../models/beneficiary.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import 'transfer_screen.dart';
import '../qr/qr_scanner_screen.dart';
import '../dashboard/dashboard_screen.dart';

class TransferTypeScreen extends StatefulWidget {
  final Account? initialFrom;
  const TransferTypeScreen({super.key, this.initialFrom});

  @override
  State<TransferTypeScreen> createState() => _TransferTypeScreenState();
}

class _TransferTypeScreenState extends State<TransferTypeScreen> {
  final BankingService _service = BankingService(ApiClient());
  List<Beneficiary> _saved = [];
  List<Map<String, dynamic>> _recentTransfers =
      []; // Recent transfer recipients
  final ValueNotifier<int> _tabVN = ValueNotifier<int>(
    0,
  ); // 0: saved, 1: templates
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      // Load saved beneficiaries
      final list = await _service.getBeneficiaries();

      // Load recent transfers to get transfer history
      final transactions = await _service.getTransactions();

      // Extract unique recipients from transfer transactions
      final recentRecipients = <String, Map<String, dynamic>>{};

      for (final transaction in transactions) {
        if (transaction.type == 'TRANSFER' &&
            transaction.receiverAccount != null) {
          final receiverAccount = transaction.receiverAccount!;
          final accountNumber = receiverAccount.accountNumber;
          final accountName = receiverAccount.accountName;

          // Only add if not already in saved beneficiaries
          final isInSaved = list.any((b) => b.accountNumber == accountNumber);
          if (!isInSaved && !recentRecipients.containsKey(accountNumber)) {
            recentRecipients[accountNumber] = {
              'accountNumber': accountNumber,
              'accountName': accountName,
              'bankName': 'Ngân hàng TMCP Quân đội', // Default bank name
              'lastTransferDate': transaction.createdAt.toIso8601String(),
            };
          }
        }
      }

      // Convert to list and sort by last transfer date (most recent first)
      final recentList = recentRecipients.values.toList();
      recentList.sort(
        (a, b) => DateTime.parse(
          b['lastTransferDate'],
        ).compareTo(DateTime.parse(a['lastTransferDate'])),
      );

      setState(() {
        _saved = list;
        _recentTransfers = recentList.take(10).toList(); // Limit to 10
      });

      print('🔍 Transfer Type: Loaded ${_saved.length} saved beneficiaries');
      print(
        '🔍 Transfer Type: Loaded ${_recentTransfers.length} recent transfers',
      );
    } catch (e) {
      print('🔍 Transfer Type: Error loading data: $e');
    }
  }

  Future<void> _scanQR() async {
    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(builder: (context) => const QRScannerScreen()),
    );

    if (result != null && mounted) {
      // Xử lý kết quả QR code
      _handleQRResult(result);
    }
  }

  void _handleQRResult(Map<String, dynamic> qrData) {
    print('🔍 Transfer Type: Received QR data: $qrData');
    print('🔍 Transfer Type: QR data keys: ${qrData.keys.toList()}');

    try {
      final accountNumber = qrData['accountNumber'] as String?;
      final accountName = qrData['accountName'] as String?;
      final bankName =
          qrData['bankName'] as String? ?? 'Ngân hàng TMCP Quân đội';

      print('🔍 Transfer Type: Parsed data:');
      print('🔍 Transfer Type: - Account Number: $accountNumber');
      print('🔍 Transfer Type: - Account Name: $accountName');
      print('🔍 Transfer Type: - Bank Name: $bankName');

      if (accountNumber != null) {
        // Ensure we always have a name
        final finalAccountName = accountName ?? 'Người nhận $accountNumber';
        print('🔍 Transfer Type: Using account name: $finalAccountName');

        // Tạo Beneficiary object từ QR data
        final beneficiary = Beneficiary(
          id: 'qr_${DateTime.now().millisecondsSinceEpoch}',
          name: finalAccountName,
          accountNumber: accountNumber,
          bankName: bankName,
        );

        print(
          '🔍 Transfer Type: Created beneficiary: ${beneficiary.name} - ${beneficiary.accountNumber}',
        );

        // Navigate to transfer screen với thông tin từ QR
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => TransferScreen(
              initialFrom: widget.initialFrom,
              initialTo: beneficiary,
            ),
          ),
        );
      } else {
        print('🔍 Transfer Type: Account number is null!');
        // Hiển thị lỗi nếu thiếu thông tin
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('QR Code không chứa đủ thông tin cần thiết'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Hiển thị lỗi nếu QR không hợp lệ
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Mã QR không hợp lệ: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _tabVN.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const double cardHeight = 104;
    const brandBrown = Color(0xFF6B2C2C);
    const pastelBg = Color(0xFFF6F7FB);
    Widget tile({
      required IconData icon,
      required String title,
      required String subtitle,
      required VoidCallback onTap,
      Color color = brandBrown,
    }) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0x11000000)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: SizedBox(
            height: cardHeight,
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: color.withOpacity(0.10),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (subtitle.isNotEmpty)
                        Text(
                          subtitle,
                          style: const TextStyle(
                            color: Colors.black54,
                            fontSize: 12,
                            height: 1.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                const Icon(
                  Ionicons.chevron_forward_outline,
                  color: Colors.black45,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: pastelBg,
      appBar: AppBar(
        title: const Text(''),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        foregroundColor: brandBrown,
        actions: [
          const Icon(
            Ionicons.notifications_outline,
            color: brandBrown,
            size: 26,
          ),
          const SizedBox(width: 24),
          GestureDetector(
            onTap: () => Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const DashboardScreen()),
            ),
            child: const Icon(
              Ionicons.home_outline,
              color: brandBrown,
              size: 26,
            ),
          ),
          const SizedBox(width: 24),
        ],
      ),
      body: DefaultTextStyle.merge(
        style: const TextStyle(color: Colors.black),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Title row like MB Bank
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Chuyển tiền',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: brandBrown,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: _scanQR,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Ionicons.qr_code_outline,
                      color: brandBrown,
                      size: 26,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Grid 2 cột theo mẫu
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 2.1,
              children: [
                tile(
                  icon: Ionicons.cash_outline,
                  title: 'Số tài khoản',
                  subtitle: '',
                  onTap: () => _openDetail(),
                ),
                tile(
                  icon: Ionicons.call_outline,
                  title: 'Số điện thoại',
                  subtitle: '',
                  onTap: () => _openDetail(),
                  color: const Color(0xFF3B82F6),
                ),
                tile(
                  icon: Ionicons.card_outline,
                  title: 'Số thẻ',
                  subtitle: '',
                  onTap: () => _openDetail(),
                  color: const Color(0xFFFB7185),
                ),
                tile(
                  icon: Ionicons.hand_left_outline,
                  title: 'Ví điện tử & Đối tác',
                  subtitle: '',
                  onTap: () {},
                  color: const Color(0xFF8B5CF6),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Gần đây',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 12),
            _buildRecentRecipients(),
            const SizedBox(height: 16),
            // Toggle chips
            ValueListenableBuilder<int>(
              valueListenable: _tabVN,
              builder: (context, tab, _) {
                return Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _tabVN.value = 0,
                        child: Container(
                          height: 36,
                          decoration: BoxDecoration(
                            color: tab == 0
                                ? const Color(0xFFFFE0B3)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0x11000000)),
                          ),
                          child: Center(
                            child: Text(
                              'Đã lưu',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: tab == 0
                                    ? const Color(0xFFB45309)
                                    : Colors.black,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _tabVN.value = 1,
                        child: Container(
                          height: 36,
                          decoration: BoxDecoration(
                            color: tab == 1
                                ? const Color(0xFFFFE0B3)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0x11000000)),
                          ),
                          child: Center(
                            child: Text(
                              'Mẫu chuyển tiền',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: tab == 1
                                    ? const Color(0xFFB45309)
                                    : Colors.black,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                hintText: 'Tìm theo tên, số tài khoản',
                prefixIcon: Icon(Ionicons.search_outline),
                contentPadding: EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            ValueListenableBuilder<int>(
              valueListenable: _tabVN,
              builder: (context, tab, _) {
                return Column(children: _buildSavedList(tab: tab));
              },
            ),
          ],
        ),
      ),
    );
  }

  void _openDetail() => Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => TransferScreen(initialFrom: widget.initialFrom),
    ),
  );

  Widget _buildRecentRecipients() {
    // Combine saved beneficiaries and recent transfers
    final allRecipients = <Map<String, dynamic>>[];

    // Add saved beneficiaries first
    for (final beneficiary in _saved) {
      allRecipients.add({
        'accountNumber': beneficiary.accountNumber,
        'accountName': beneficiary.name,
        'bankName': beneficiary.bankName,
        'isSaved': true,
      });
    }

    // Add recent transfers (excluding duplicates)
    for (final transfer in _recentTransfers) {
      final isDuplicate = allRecipients.any(
        (r) => r['accountNumber'] == transfer['accountNumber'],
      );
      if (!isDuplicate) {
        allRecipients.add({
          'accountNumber': transfer['accountNumber'],
          'accountName': transfer['accountName'],
          'bankName': transfer['bankName'],
          'isSaved': false,
          'lastTransferDate': transfer['lastTransferDate'],
        });
      }
    }

    if (allRecipients.isEmpty) {
      return Container(
        height: 80,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: const Text(
          'Chưa có người nhận gần đây',
          style: TextStyle(color: Colors.black54),
        ),
      );
    }

    return SizedBox(
      height: 70, // Increased from 50 to 70
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemBuilder: (_, i) {
          final recipient = allRecipients[i];
          final name = recipient['accountName'] as String? ?? '';
          final isSaved = recipient['isSaved'] as bool;

          return GestureDetector(
            onTap: () => _openTransferToRecipient(recipient),
            child: SizedBox(
              height: 70,
              width: 80, // Increased from 72 to 80
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 20, // Increased from 16 to 20
                    backgroundColor: isSaved
                        ? const Color(0xFFEFEFF6)
                        : const Color(0xFFF0F9FF),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: TextStyle(
                        color: isSaved
                            ? const Color(0xFF6B2C2C)
                            : const Color(0xFF3B82F6),
                        fontWeight: FontWeight.bold,
                        fontSize: 14, // Increased from 12 to 14
                      ),
                    ),
                  ),
                  const SizedBox(height: 6), // Increased from 2 to 6
                  Flexible(
                    child: Text(
                      name,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      style: TextStyle(
                        fontSize: 12, // Increased from 10 to 12
                        color: isSaved ? Colors.black : const Color(0xFF3B82F6),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemCount: allRecipients.length.clamp(0, 10),
      ),
    );
  }

  void _openTransferToRecipient(Map<String, dynamic> recipient) {
    final beneficiary = Beneficiary(
      id: 'recent_${DateTime.now().millisecondsSinceEpoch}',
      name: recipient['accountName'] as String? ?? '',
      accountNumber: recipient['accountNumber'] as String? ?? '',
      bankName: recipient['bankName'] as String? ?? '',
    );

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TransferScreen(
          initialFrom: widget.initialFrom,
          initialTo: beneficiary,
        ),
      ),
    );
  }

  List<Widget> _buildSavedList({int? tab}) {
    final t = tab ?? _tabVN.value;
    if (t == 1) {
      return [
        Container(
          height: 120,
          alignment: Alignment.center,
          child: const Text(
            'Chưa có mẫu chuyển tiền',
            style: TextStyle(color: Colors.black54),
          ),
        ),
      ];
    }
    final keyword = _searchCtrl.text.trim().toLowerCase();
    final list = _saved
        .where(
          (b) =>
              keyword.isEmpty ||
              b.name.toLowerCase().contains(keyword) ||
              b.accountNumber.contains(keyword),
        )
        .toList();
    if (list.isEmpty) {
      return [
        Container(
          height: 120,
          alignment: Alignment.center,
          child: const Text(
            'Chưa có người thụ hưởng phù hợp',
            style: TextStyle(color: Colors.black54),
          ),
        ),
      ];
    }
    return list.map((b) => _savedItem(b)).toList();
  }

  Widget _savedItem(Beneficiary b) {
    return Column(
      children: [
        ListTile(
          leading: CircleAvatar(
            backgroundColor: const Color(0xFFFFF1F2),
            child: Text(b.name.isNotEmpty ? b.name[0] : '?'),
          ),
          title: Text(
            b.name.toUpperCase(),
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          subtitle: Text(
            '${b.accountNumber}\nNgân hàng TMCP Quân đội',
            maxLines: 2,
          ),
          trailing: const Icon(Ionicons.ellipsis_horizontal_outline),
          onTap: _openDetail,
        ),
        const Divider(height: 1),
      ],
    );
  }
}
