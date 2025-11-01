class Beneficiary {
  final String id;
  final String name;
  final String accountNumber;
  final String? bankCode;
  final String? bankName;

  Beneficiary({
    required this.id,
    required this.name,
    required this.accountNumber,
    this.bankCode,
    this.bankName,
  });

  factory Beneficiary.fromJson(Map<String, dynamic> json) {
    return Beneficiary(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      accountNumber: json['accountNumber'] as String? ?? '',
      bankCode: json['bankCode'] as String?,
      bankName: json['bankName'] as String?,
    );
  }
}
