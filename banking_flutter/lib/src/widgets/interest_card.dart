import 'package:flutter/material.dart';
import '../models/interest.dart';
import '../services/interest_service.dart';
import '../services/http_client.dart';

class InterestCard extends StatefulWidget {
  const InterestCard({super.key});

  @override
  State<InterestCard> createState() => _InterestCardState();
}

class _InterestCardState extends State<InterestCard> {
  final InterestService _interestService = InterestService(ApiClient());

  YearlyInterestSummary? _yearlySummary;
  InterestRate? _currentRate;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInterestData();
  }

  Future<void> _loadInterestData() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Lấy tổng lãi suất năm hiện tại
      final yearlyResult = await _interestService.getYearlyInterest();
      if (yearlyResult['success'] == true) {
        _yearlySummary = YearlyInterestSummary.fromJson(yearlyResult['data']);
      }

      // Lấy lãi suất hiện tại cho tài khoản tiết kiệm
      final rateResult = await _interestService.getCurrentRates(
        accountType: 'SAVINGS',
        tier: 'STANDARD',
      );
      if (rateResult['success'] == true) {
        _currentRate = InterestRate.fromJson(rateResult['data']);
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return _buildLoadingCard();
    }

    if (_error != null) {
      return _buildErrorCard();
    }

    return _buildInterestCard();
  }

  Widget _buildLoadingCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(
                                                alpha:0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: const Column(
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          ),
          SizedBox(height: 12),
          Text(
            'Đang tải thông tin lãi suất...',
            style: TextStyle(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade600, size: 32),
          const SizedBox(height: 12),
          Text(
            'Không thể tải thông tin lãi suất',
            style: TextStyle(
              color: Colors.red.shade700,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _error ?? 'Đã xảy ra lỗi không xác định',
            style: TextStyle(color: Colors.red.shade600, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadInterestData,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
            ),
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildInterestCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(
                                                alpha:0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(
                                                alpha:0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.savings, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Lãi suất tiết kiệm',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                onPressed: _loadInterestData,
                icon: const Icon(Icons.refresh, color: Colors.white),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Current Rate
          if (_currentRate != null) ...[
            _buildInfoRow(
              'Lãi suất hiện tại',
              '${_currentRate!.annualRate}%/năm',
              Icons.trending_up,
            ),
            const SizedBox(height: 12),
          ],

          // Yearly Summary
          if (_yearlySummary != null) ...[
            _buildInfoRow(
              'Lãi suất năm ${_yearlySummary!.year}',
              _yearlySummary!.totalInterestDisplay,
              Icons.account_balance_wallet,
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              'Số lần nhận lãi',
              '${_yearlySummary!.transactionCount} lần',
              Icons.receipt_long,
            ),
            const SizedBox(height: 16),
          ],

          // Action Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Navigate to interest history
                Navigator.pushNamed(context, '/interest-history');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF667eea),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Xem lịch sử lãi suất',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: Colors.white.withValues(
                                                alpha:0.8), size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(
                                                alpha:0.9),
              fontSize: 14,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class InterestHistoryScreen extends StatefulWidget {
  const InterestHistoryScreen({super.key});

  @override
  State<InterestHistoryScreen> createState() => _InterestHistoryScreenState();
}

class _InterestHistoryScreenState extends State<InterestHistoryScreen> {
  final InterestService _interestService = InterestService(ApiClient());

  List<Interest> _interests = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadInterestHistory();
  }

  Future<void> _loadInterestHistory({bool refresh = false}) async {
    try {
      if (refresh) {
        setState(() {
          _currentPage = 1;
          _hasMore = true;
          _interests.clear();
        });
      }

      setState(() {
        _isLoading = true;
        _error = null;
      });

      final result = await _interestService.getInterestHistory(
        limit: 20,
        page: _currentPage,
      );

      if (result['success'] == true) {
        final List<dynamic> data = result['data'] ?? [];
        final List<Interest> newInterests = data
            .map((json) => Interest.fromJson(json))
            .toList();

        setState(() {
          if (refresh) {
            _interests = newInterests;
          } else {
            _interests.addAll(newInterests);
          }
          _hasMore = newInterests.length >= 20;
          _currentPage++;
        });
      } else {
        setState(() {
          _error = result['message'] ?? 'Không thể tải lịch sử lãi suất';
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F23),
      appBar: AppBar(
        title: const Text(
          'Lịch sử lãi suất',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            onPressed: () => _loadInterestHistory(refresh: true),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _interests.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFA855F7)),
        ),
      );
    }

    if (_error != null && _interests.isEmpty) {
      return _buildErrorWidget();
    }

    if (_interests.isEmpty) {
      return _buildEmptyWidget();
    }

    return RefreshIndicator(
      onRefresh: () => _loadInterestHistory(refresh: true),
      color: const Color(0xFFA855F7),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _interests.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _interests.length) {
            // Load more indicator
            if (_hasMore) {
              _loadInterestHistory();
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Color(0xFFA855F7),
                    ),
                  ),
                ),
              );
            }
            return const SizedBox.shrink();
          }

          return _buildInterestCard(_interests[index]);
        },
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.red.shade400, size: 64),
            const SizedBox(height: 16),
            Text(
              'Không thể tải lịch sử lãi suất',
              style: TextStyle(
                color: Colors.red.shade400,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Đã xảy ra lỗi không xác định',
              style: const TextStyle(color: Colors.white70, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => _loadInterestHistory(refresh: true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade600,
                foregroundColor: Colors.white,
              ),
              child: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.savings_outlined,
              color: Colors.white.withValues(
                                                alpha:0.5),
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có lãi suất',
              style: TextStyle(
                color: Colors.white.withValues(
                                                alpha:0.7),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Lãi suất sẽ được tính và cộng vào tài khoản hàng tháng',
              style: TextStyle(
                color: Colors.white.withValues(
                                                alpha:0.5),
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInterestCard(Interest interest) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(
                                                alpha:0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFA855F7).withValues(
                                                alpha:0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.account_balance_wallet,
                  color: Color(0xFFA855F7),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      interest.account?.accountName ?? 'Tài khoản tiết kiệm',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      interest.account?.accountNumber ?? '',
                      style: TextStyle(
                        color: Colors.white.withValues(
                                                alpha:0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Color(
                    int.parse(interest.statusColor.replaceAll('#', '0xFF')),
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  interest.statusDisplay,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Interest Details
          Row(
            children: [
              Expanded(
                child: _buildDetailItem(
                  'Lãi suất',
                  '${interest.interestRate}%/năm',
                  Icons.trending_up,
                ),
              ),
              Expanded(
                child: _buildDetailItem(
                  'Số tiền lãi',
                  '+${interest.formatCurrency(interest.interestAmount)}',
                  Icons.add_circle,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildDetailItem(
                  'Kỳ tính lãi',
                  '${interest.formatDate(interest.periodStart)} - ${interest.formatDate(interest.periodEnd)}',
                  Icons.calendar_today,
                ),
              ),
              Expanded(
                child: _buildDetailItem(
                  'Thời gian',
                  interest.relativeTime,
                  Icons.access_time,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white.withValues(
                                                alpha:0.6), size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(
                                                alpha:0.7),
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
