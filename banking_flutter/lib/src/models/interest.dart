class Interest {
  final String id;
  final String userId;
  final String accountId;
  final String interestType;
  final double interestRate;
  final double principalAmount;
  final double interestAmount;
  final double totalAmount;
  final DateTime calculationDate;
  final DateTime periodStart;
  final DateTime periodEnd;
  final String status;
  final DateTime? postedAt;
  final String? transactionId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final AccountInfo? account;

  Interest({
    required this.id,
    required this.userId,
    required this.accountId,
    required this.interestType,
    required this.interestRate,
    required this.principalAmount,
    required this.interestAmount,
    required this.totalAmount,
    required this.calculationDate,
    required this.periodStart,
    required this.periodEnd,
    required this.status,
    this.postedAt,
    this.transactionId,
    required this.createdAt,
    required this.updatedAt,
    this.account,
  });

  factory Interest.fromJson(Map<String, dynamic> json) {
    return Interest(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      accountId: json['accountId'] as String? ?? '',
      interestType: json['interestType'] as String? ?? 'SAVINGS',
      interestRate: (json['interestRate'] as num?)?.toDouble() ?? 0.0,
      principalAmount: (json['principalAmount'] as num?)?.toDouble() ?? 0.0,
      interestAmount: (json['interestAmount'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      calculationDate: DateTime.parse(
        json['calculationDate'] as String? ?? DateTime.now().toIso8601String(),
      ),
      periodStart: DateTime.parse(
        json['periodStart'] as String? ?? DateTime.now().toIso8601String(),
      ),
      periodEnd: DateTime.parse(
        json['periodEnd'] as String? ?? DateTime.now().toIso8601String(),
      ),
      status: json['status'] as String? ?? 'PENDING',
      postedAt: json['postedAt'] != null
          ? DateTime.parse(json['postedAt'] as String)
          : null,
      transactionId: json['transactionId'] as String?,
      createdAt: DateTime.parse(
        json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      updatedAt: DateTime.parse(
        json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      account: json['account'] != null
          ? AccountInfo.fromJson(json['account'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'accountId': accountId,
      'interestType': interestType,
      'interestRate': interestRate,
      'principalAmount': principalAmount,
      'interestAmount': interestAmount,
      'totalAmount': totalAmount,
      'calculationDate': calculationDate.toIso8601String(),
      'periodStart': periodStart.toIso8601String(),
      'periodEnd': periodEnd.toIso8601String(),
      'status': status,
      'postedAt': postedAt?.toIso8601String(),
      'transactionId': transactionId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'account': account?.toJson(),
    };
  }

  /// Lấy loại lãi suất bằng tiếng Việt
  String get interestTypeDisplay {
    switch (interestType) {
      case 'SAVINGS':
        return 'Tiết kiệm';
      case 'TERM_DEPOSIT':
        return 'Gửi có kỳ hạn';
      case 'COMPOUND':
        return 'Lãi kép';
      default:
        return interestType;
    }
  }

  /// Lấy trạng thái bằng tiếng Việt
  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'POSTED':
        return 'Đã cộng';
      case 'FAILED':
        return 'Thất bại';
      default:
        return status;
    }
  }

  /// Lấy màu sắc cho trạng thái
  String get statusColor {
    switch (status) {
      case 'PENDING':
        return '#FFA500'; // Orange
      case 'POSTED':
        return '#28A745'; // Green
      case 'FAILED':
        return '#DC3545'; // Red
      default:
        return '#6C757D'; // Gray
    }
  }

  /// Format số tiền với định dạng VND
  String formatCurrency(double amount) {
    return '${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VND';
  }

  /// Format ngày tháng
  String formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  /// Format thời gian tương đối
  String get relativeTime {
    final now = DateTime.now();
    final difference = now.difference(calculationDate);

    if (difference.inDays > 0) {
      return '${difference.inDays} ngày trước';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} phút trước';
    } else {
      return 'Vừa xong';
    }
  }
}

class AccountInfo {
  final String accountNumber;
  final String accountName;
  final String accountType;

  AccountInfo({
    required this.accountNumber,
    required this.accountName,
    required this.accountType,
  });

  factory AccountInfo.fromJson(Map<String, dynamic> json) {
    return AccountInfo(
      accountNumber: json['accountNumber'] as String? ?? '',
      accountName: json['accountName'] as String? ?? '',
      accountType: json['accountType'] as String? ?? 'SAVINGS',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accountNumber': accountNumber,
      'accountName': accountName,
      'accountType': accountType,
    };
  }

  /// Lấy loại tài khoản bằng tiếng Việt
  String get accountTypeDisplay {
    switch (accountType) {
      case 'SAVINGS':
        return 'Tiết kiệm';
      case 'CHECKING':
        return 'Thanh toán';
      case 'BUSINESS':
        return 'Doanh nghiệp';
      case 'JOINT':
        return 'Liên kết';
      case 'STUDENT':
        return 'Sinh viên';
      default:
        return accountType;
    }
  }
}

class InterestRate {
  final String accountType;
  final String tier;
  final double annualRate;
  final double minimumBalance;

  InterestRate({
    required this.accountType,
    required this.tier,
    required this.annualRate,
    required this.minimumBalance,
  });

  factory InterestRate.fromJson(Map<String, dynamic> json) {
    return InterestRate(
      accountType: json['accountType'] as String? ?? 'SAVINGS',
      tier: json['tier'] as String? ?? 'STANDARD',
      annualRate: (json['annualRate'] as num?)?.toDouble() ?? 0.0,
      minimumBalance: (json['minimumBalance'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accountType': accountType,
      'tier': tier,
      'annualRate': annualRate,
      'minimumBalance': minimumBalance,
    };
  }

  /// Lấy loại tài khoản bằng tiếng Việt
  String get accountTypeDisplay {
    switch (accountType) {
      case 'SAVINGS':
        return 'Tiết kiệm';
      case 'TERM_DEPOSIT_3M':
        return 'Gửi 3 tháng';
      case 'TERM_DEPOSIT_6M':
        return 'Gửi 6 tháng';
      case 'TERM_DEPOSIT_12M':
        return 'Gửi 12 tháng';
      case 'TERM_DEPOSIT_24M':
        return 'Gửi 24 tháng';
      default:
        return accountType;
    }
  }

  /// Lấy tier bằng tiếng Việt
  String get tierDisplay {
    switch (tier) {
      case 'STANDARD':
        return 'Chuẩn';
      case 'PREMIUM':
        return 'Cao cấp';
      case 'VIP':
        return 'VIP';
      default:
        return tier;
    }
  }

  /// Format số tiền tối thiểu
  String get minimumBalanceDisplay {
    if (minimumBalance == 0) {
      return 'Không giới hạn';
    }
    return '${minimumBalance.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VND';
  }
}

class YearlyInterestSummary {
  final double totalInterest;
  final int transactionCount;
  final int year;

  YearlyInterestSummary({
    required this.totalInterest,
    required this.transactionCount,
    required this.year,
  });

  factory YearlyInterestSummary.fromJson(Map<String, dynamic> json) {
    return YearlyInterestSummary(
      totalInterest: (json['totalInterest'] as num?)?.toDouble() ?? 0.0,
      transactionCount: json['transactionCount'] as int? ?? 0,
      year: json['year'] as int? ?? DateTime.now().year,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalInterest': totalInterest,
      'transactionCount': transactionCount,
      'year': year,
    };
  }

  /// Format tổng lãi suất
  String get totalInterestDisplay {
    return '${totalInterest.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VND';
  }
}
