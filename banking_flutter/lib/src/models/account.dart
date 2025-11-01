class Account {
  final String id;
  final String accountNumber;
  final String accountType;
  final String accountName;
  final String currency;
  final double balance;
  final double availableBalance;

  Account({
    required this.id,
    required this.accountNumber,
    required this.accountType,
    required this.accountName,
    required this.currency,
    required this.balance,
    required this.availableBalance,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    final id = (json['id'] ?? json['accountId']) as String?;
    final accNum = json['accountNumber'] as String?;
    final accType = json['accountType'] as String?;
    final accName = json['accountName'] as String?;
    final curr = (json['currency'] ?? 'VND') as String?;
    final balNum = json['balance'];
    final availNum = json['availableBalance'];

    // Provide default values for missing fields instead of throwing error
    return Account(
      id: id ?? 'unknown',
      accountNumber: accNum ?? 'N/A',
      accountType: accType ?? 'UNKNOWN',
      accountName: accName ?? 'Unknown Account',
      currency: curr ?? 'VND',
      balance: (balNum is num)
          ? balNum.toDouble()
          : (balNum != null ? double.tryParse(balNum.toString()) ?? 0.0 : 0.0),
      availableBalance: (availNum is num)
          ? availNum.toDouble()
          : (availNum != null
                ? double.tryParse(availNum.toString()) ?? 0.0
                : 0.0),
    );
  }
}
