import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int? _expandedFaqIndex;
  int? _expandedGuideIndex;
  final Map<int, ExpansionTileController> _faqControllers = {};
  final Map<int, ExpansionTileController> _guideControllers = {};

  final List<Map<String, dynamic>> _faqItems = [
    {
      'question': 'Làm thế nào để đăng ký tài khoản?',
      'answer':
          'Bạn có thể đăng ký tài khoản bằng cách:\n\n1. Nhập mã số sinh viên\n2. Nhập mật khẩu\n3. Xác thực email\n4. Hoàn thành thông tin cá nhân',
      'category': 'Đăng ký',
    },
    {
      'question': 'Quên mật khẩu phải làm sao?',
      'answer':
          'Nếu quên mật khẩu:\n\n1. Nhấn "Quên mật khẩu?" ở màn hình đăng nhập\n2. Nhập email đã đăng ký\n3. Kiểm tra mã xác nhận trong email\n4. Nhập mã và đặt mật khẩu mới',
      'category': 'Bảo mật',
    },
    {
      'question': 'Làm sao để chuyển tiền?',
      'answer':
          'Để chuyển tiền:\n\n1. Vào màn hình "Chuyển tiền"\n2. Nhập số tài khoản người nhận\n3. Nhập số tiền\n4. Nhập mã PIN\n5. Xác nhận giao dịch',
      'category': 'Giao dịch',
    },
    {
      'question': 'Phí giao dịch là bao nhiêu?',
      'answer':
          'Phí giao dịch:\n\n• Chuyển tiền nội bộ: Miễn phí\n• Chuyển tiền liên ngân hàng: 5,000 VNĐ\n• Rút tiền ATM: 3,000 VNĐ\n• Phí duy trì tài khoản: Miễn phí',
      'category': 'Phí dịch vụ',
    },
    {
      'question': 'Làm sao để nạp tiền vào tài khoản?',
      'answer':
          'Các cách nạp tiền:\n\n1. Chuyển khoản từ ngân hàng khác\n2. Nạp tiền tại ATM\n3. Nạp tiền tại quầy giao dịch\n4. Liên kết thẻ ngân hàng',
      'category': 'Nạp tiền',
    },
    {
      'question': 'Tài khoản bị khóa phải làm sao?',
      'answer':
          'Nếu tài khoản bị khóa:\n\n1. Kiểm tra email thông báo\n2. Liên hệ hotline: 1900-xxxx\n3. Đến chi nhánh gần nhất\n4. Cung cấp giấy tờ tùy thân',
      'category': 'Tài khoản',
    },
    {
      'question': 'Làm sao để rút tiền từ ATM?',
      'answer':
          'Để rút tiền từ ATM:\n\n1. Đưa thẻ vào máy ATM\n2. Nhập mã PIN\n3. Chọn "Rút tiền"\n4. Nhập số tiền cần rút\n5. Lấy tiền và thẻ',
      'category': 'Giao dịch',
    },
    {
      'question': 'Thẻ bị mất hoặc bị đánh cắp phải làm gì?',
      'answer':
          'Khi thẻ bị mất hoặc đánh cắp:\n\n1. Gọi ngay hotline: 1900-xxxx\n2. Báo khóa thẻ ngay lập tức\n3. Đến chi nhánh làm thẻ mới\n4. Cập nhật thông tin bảo mật',
      'category': 'Bảo mật',
    },
    {
      'question': 'Làm sao để thay đổi số điện thoại?',
      'answer':
          'Để thay đổi số điện thoại:\n\n1. Vào màn hình "Hồ sơ"\n2. Chọn "Cài đặt tài khoản"\n3. Nhấn "Đổi số điện thoại"\n4. Nhập số mới và xác thực\n5. Nhập mã OTP được gửi về số mới',
      'category': 'Tài khoản',
    },
    {
      'question': 'Làm sao để bật xác thực 2 yếu tố (2FA)?',
      'answer':
          'Để bật 2FA:\n\n1. Vào màn hình "Hồ sơ"\n2. Chọn "Bảo mật"\n3. Nhấn "Xác thực 2 yếu tố"\n4. Nhập mật khẩu hiện tại\n5. Quét mã QR hoặc nhập mã bảo mật',
      'category': 'Bảo mật',
    },
    {
      'question': 'Làm sao để kiểm tra số dư tài khoản?',
      'answer':
          'Cách kiểm tra số dư:\n\n1. Đăng nhập vào ứng dụng\n2. Vào màn hình "Trang chủ"\n3. Số dư hiển thị ngay trên đầu\n4. Hoặc vào "Tài khoản" để xem chi tiết',
      'category': 'Tài khoản',
    },
    {
      'question': 'Làm sao để xem lịch sử giao dịch?',
      'answer':
          'Để xem lịch sử giao dịch:\n\n1. Vào màn hình "Giao dịch"\n2. Chọn khoảng thời gian\n3. Lọc theo loại giao dịch\n4. Xem chi tiết từng giao dịch',
      'category': 'Giao dịch',
    },
    {
      'question': 'Làm sao để thanh toán hóa đơn?',
      'answer':
          'Để thanh toán hóa đơn:\n\n1. Vào màn hình "Thanh toán"\n2. Chọn loại hóa đơn\n3. Nhập mã khách hàng\n4. Kiểm tra thông tin\n5. Xác nhận thanh toán',
      'category': 'Giao dịch',
    },
    {
      'question': 'Làm sao để đăng ký nhận thông báo?',
      'answer':
          'Để đăng ký nhận thông báo:\n\n1. Vào màn hình "Hồ sơ"\n2. Chọn "Cài đặt"\n3. Nhấn "Thông báo"\n4. Bật các loại thông báo cần thiết\n5. Lưu cài đặt',
      'category': 'Cài đặt',
    },
    {
      'question': 'Làm sao để liên kết thẻ ngân hàng?',
      'answer':
          'Để liên kết thẻ ngân hàng:\n\n1. Vào màn hình "Thẻ"\n2. Nhấn "Thêm thẻ mới"\n3. Nhập thông tin thẻ\n4. Xác thực qua SMS\n5. Kích hoạt thẻ',
      'category': 'Thẻ',
    },
    {
      'question': 'Làm sao để đổi mã PIN?',
      'answer':
          'Để đổi mã PIN:\n\n1. Vào màn hình "Bảo mật"\n2. Chọn "Đổi mã PIN"\n3. Nhập mã PIN cũ\n4. Nhập mã PIN mới\n5. Xác nhận mã PIN mới',
      'category': 'Bảo mật',
    },
    {
      'question': 'Làm sao để tăng hạn mức giao dịch?',
      'answer':
          'Để tăng hạn mức:\n\n1. Vào màn hình "Tài khoản"\n2. Chọn "Hạn mức giao dịch"\n3. Nhấn "Yêu cầu tăng hạn mức"\n4. Cung cấp giấy tờ chứng minh\n5. Chờ phê duyệt',
      'category': 'Tài khoản',
    },
    {
      'question': 'Làm sao để đóng tài khoản?',
      'answer':
          'Để đóng tài khoản:\n\n1. Liên hệ hotline: 1900-xxxx\n2. Hoặc đến chi nhánh gần nhất\n3. Cung cấp giấy tờ tùy thân\n4. Thanh toán hết các khoản nợ\n5. Rút hết số dư',
      'category': 'Tài khoản',
    },
    {
      'question': 'Ứng dụng bị lỗi phải làm sao?',
      'answer':
          'Khi ứng dụng bị lỗi:\n\n1. Thử đóng và mở lại ứng dụng\n2. Cập nhật ứng dụng lên phiên bản mới nhất\n3. Xóa cache và dữ liệu ứng dụng\n4. Cài đặt lại ứng dụng\n5. Liên hệ hỗ trợ nếu vẫn lỗi',
      'category': 'Kỹ thuật',
    },
  ];

  final List<Map<String, dynamic>> _guides = [
    {
      'title': 'Hướng dẫn đăng ký tài khoản',
      'description': 'Các bước chi tiết để tạo tài khoản mới',
      'icon': Icons.person_add_outlined,
      'steps': [
        'Nhập mã số sinh viên của bạn',
        'Tạo mật khẩu mạnh (ít nhất 8 ký tự)',
        'Nhập thông tin cá nhân',
        'Xác thực email',
        'Hoàn thành KYC (nếu cần)',
      ],
    },
    {
      'title': 'Hướng dẫn chuyển tiền',
      'description': 'Cách thực hiện giao dịch chuyển tiền an toàn',
      'icon': Icons.send_outlined,
      'steps': [
        'Đăng nhập vào ứng dụng',
        'Chọn "Chuyển tiền"',
        'Nhập thông tin người nhận',
        'Kiểm tra lại thông tin',
        'Nhập mã PIN để xác nhận',
      ],
    },
    {
      'title': 'Hướng dẫn bảo mật tài khoản',
      'description': 'Các biện pháp bảo mật quan trọng',
      'icon': Icons.security_outlined,
      'steps': [
        'Bật xác thực 2 yếu tố (2FA)',
        'Đặt mật khẩu mạnh',
        'Không chia sẻ thông tin đăng nhập',
        'Đăng xuất sau khi sử dụng',
        'Cập nhật ứng dụng thường xuyên',
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    // Initialize controllers for FAQ items
    for (int i = 0; i < _faqItems.length; i++) {
      _faqControllers[i] = ExpansionTileController();
    }

    // Initialize controllers for Guide items
    for (int i = 0; i < _guides.length; i++) {
      _guideControllers[i] = ExpansionTileController();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _faqControllers.clear();
    _guideControllers.clear();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filteredFaqItems {
    if (_searchQuery.isEmpty) return _faqItems;
    return _faqItems.where((item) {
      return item['question'].toLowerCase().contains(
            _searchQuery.toLowerCase(),
          ) ||
          item['answer'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item['category'].toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Trung tâm trợ giúp',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back_ios,
            color: Color(0xFF1F2937),
            size: 20,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF6C5CE7),
          unselectedLabelColor: const Color(0xFF9CA3AF),
          indicatorColor: const Color(0xFF6C5CE7),
          labelStyle: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          tabs: const [
            Tab(text: 'FAQ'),
            Tab(text: 'Hướng dẫn'),
            Tab(text: 'Liên hệ'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [_buildFaqTab(), _buildGuidesTab(), _buildContactTab()],
      ),
    );
  }

  Widget _buildFaqTab() {
    return Column(
      children: [
        // Search bar
        Container(
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
            decoration: InputDecoration(
              hintText: 'Tìm kiếm câu hỏi...',
              hintStyle: GoogleFonts.poppins(
                color: const Color(0xFF9CA3AF),
                fontSize: 14,
              ),
              prefixIcon: const Icon(
                Icons.search,
                color: Color(0xFF9CA3AF),
                size: 20,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
          ),
        ),
        // FAQ List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _filteredFaqItems.length,
            itemBuilder: (context, index) {
              final item = _filteredFaqItems[index];
              return _buildFaqItem(item);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFaqItem(Map<String, dynamic> item) {
    final index = _filteredFaqItems.indexOf(item);
    final isExpanded = _expandedFaqIndex == index;

    return Container(
      key: ValueKey('faq_$index'),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ExpansionTile(
        key: ValueKey('expansion_$index'),
        controller: _faqControllers[index],
        onExpansionChanged: (expanded) {
          setState(() {
            if (expanded) {
              // Close all other FAQ items
              for (int i = 0; i < _faqItems.length; i++) {
                if (i != index && _faqControllers[i]?.isExpanded == true) {
                  _faqControllers[i]?.collapse();
                }
              }
              _expandedFaqIndex = index;
            } else {
              _expandedFaqIndex = null;
            }
            print(
              'FAQ $index ${expanded ? 'expanded' : 'collapsed'}, _expandedFaqIndex: $_expandedFaqIndex',
            );
          });
        },
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        childrenPadding: EdgeInsets.zero,
        collapsedIconColor: const Color(0xFF6C5CE7),
        iconColor: const Color(0xFF6C5CE7),
        shape: const Border(),
        collapsedShape: const Border(),
        title: Text(
          item['question'],
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF6C5CE7).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                item['category'],
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF6C5CE7),
                ),
              ),
            ),
          ),
        ),
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                item['answer'],
                textAlign: TextAlign.left,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: const Color(0xFF6B7280),
                  height: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuidesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _guides.length,
      itemBuilder: (context, index) {
        final guide = _guides[index];
        return _buildGuideItem(guide);
      },
    );
  }

  Widget _buildGuideItem(Map<String, dynamic> guide) {
    final index = _guides.indexOf(guide);
    final isExpanded = _expandedGuideIndex == index;

    return Container(
      key: ValueKey('guide_$index'),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ExpansionTile(
        key: ValueKey('guide_expansion_$index'),
        controller: _guideControllers[index],
        onExpansionChanged: (expanded) {
          setState(() {
            if (expanded) {
              // Close all other Guide items
              for (int i = 0; i < _guides.length; i++) {
                if (i != index && _guideControllers[i]?.isExpanded == true) {
                  _guideControllers[i]?.collapse();
                }
              }
              _expandedGuideIndex = index;
            } else {
              _expandedGuideIndex = null;
            }
          });
        },
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        childrenPadding: EdgeInsets.zero,
        collapsedIconColor: const Color(0xFF6C5CE7),
        iconColor: const Color(0xFF6C5CE7),
        shape: const Border(),
        collapsedShape: const Border(),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF6C5CE7).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(guide['icon'], color: const Color(0xFF6C5CE7), size: 20),
        ),
        title: Text(
          guide['title'],
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
        subtitle: Text(
          guide['description'],
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: const Color(0xFF6B7280),
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Các bước thực hiện:',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 8),
                ...guide['steps'].map<Widget>((step) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          margin: const EdgeInsets.only(top: 2, right: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF6C5CE7).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              '${guide['steps'].indexOf(step) + 1}',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF6C5CE7),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            step,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: const Color(0xFF6B7280),
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Contact methods
          _buildContactCard(
            title: 'Hotline hỗ trợ',
            subtitle: '1900-xxxx (24/7)',
            icon: Icons.phone_outlined,
            color: const Color(0xFF10B981),
            onTap: () => _showContactDialog('Hotline', '1900-xxxx'),
          ),
          const SizedBox(height: 12),
          _buildContactCard(
            title: 'Email hỗ trợ',
            subtitle: 'support@banking.com',
            icon: Icons.email_outlined,
            color: const Color(0xFF3B82F6),
            onTap: () => _showContactDialog('Email', 'support@banking.com'),
          ),
          const SizedBox(height: 12),
          _buildContactCard(
            title: 'Chat trực tuyến',
            subtitle: 'Trò chuyện với nhân viên',
            icon: Icons.chat_outlined,
            color: const Color(0xFF8B5CF6),
            onTap: () =>
                _showContactDialog('Chat', 'Tính năng đang phát triển'),
          ),
          const SizedBox(height: 12),
          _buildContactCard(
            title: 'Chi nhánh gần nhất',
            subtitle: 'Tìm chi nhánh và ATM',
            icon: Icons.location_on_outlined,
            color: const Color(0xFFF59E0B),
            onTap: () =>
                _showContactDialog('Chi nhánh', 'Tính năng đang phát triển'),
          ),

          const SizedBox(height: 24),

          // Report issue
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.bug_report_outlined,
                        color: Color(0xFFEF4444),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Báo cáo lỗi',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Gặp sự cố với ứng dụng? Hãy cho chúng tôi biết để cải thiện trải nghiệm của bạn.',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: const Color(0xFF6B7280),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _showReportDialog(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Báo cáo lỗi',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              color: Color(0xFF9CA3AF),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  void _showContactDialog(String method, String info) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          method,
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
        content: Text(
          info,
          style: GoogleFonts.poppins(
            fontSize: 16,
            color: const Color(0xFF6B7280),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Đóng',
              style: GoogleFonts.poppins(
                color: const Color(0xFF6C5CE7),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showReportDialog() {
    final TextEditingController reportController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Báo cáo lỗi',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Mô tả chi tiết về lỗi bạn gặp phải:',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reportController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Nhập mô tả lỗi...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Hủy',
              style: GoogleFonts.poppins(
                color: const Color(0xFF6B7280),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Cảm ơn bạn đã báo cáo! Chúng tôi sẽ xem xét và khắc phục sớm nhất.',
                  ),
                  backgroundColor: const Color(0xFF10B981),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Gửi báo cáo',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
