class BankCard {
  final String id;
  final String cardNumber;
  final String cardBrand; // VISA/MASTERCARD
  final int expiryMonth;
  final int expiryYear;
  final bool isActive;
  final bool isBlocked;

  BankCard({
    required this.id,
    required this.cardNumber,
    required this.cardBrand,
    required this.expiryMonth,
    required this.expiryYear,
    required this.isActive,
    required this.isBlocked,
  });

  factory BankCard.fromJson(Map<String, dynamic> json) {
    return BankCard(
      id: (json['id'] ?? json['cardId']) as String? ?? '',
      cardNumber: json['cardNumber'] as String? ?? '',
      cardBrand: (json['cardBrand'] ?? 'VISA') as String? ?? 'VISA',
      expiryMonth: (json['expiryMonth'] as num).toInt(),
      expiryYear: (json['expiryYear'] as num).toInt(),
      isActive: (json['isActive'] as bool?) ?? true,
      isBlocked: (json['isBlocked'] as bool?) ?? false,
    );
  }
}
