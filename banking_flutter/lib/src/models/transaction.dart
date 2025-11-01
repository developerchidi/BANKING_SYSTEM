import 'account.dart';

class BankTransaction {
  final String id;
  final String transactionNumber;
  final String type; // TRANSFER, DEPOSIT, WITHDRAWAL, PAYMENT, etc.
  final String status; // COMPLETED, PENDING, FAILED, CANCELLED
  final double amount;
  final double fee;
  final String currency;
  final String? description;
  final DateTime createdAt;
  final DateTime processedAt;
  final DateTime? updatedAt;

  // Account information
  final String? senderAccountId;
  final String? receiverAccountId;
  final Account? senderAccount;
  final Account? receiverAccount;

  // Source information (for system/external transfers)
  final String? sourceType; // SYSTEM | INTERNAL | EXTERNAL
  final String? externalAccountName;
  final String? externalAccountNumber;
  final String? externalBankCode;

  BankTransaction({
    required this.id,
    required this.transactionNumber,
    required this.type,
    required this.status,
    required this.amount,
    this.fee = 0.0,
    required this.currency,
    required this.createdAt,
    required this.processedAt,
    this.updatedAt,
    this.description,
    this.senderAccountId,
    this.receiverAccountId,
    this.senderAccount,
    this.receiverAccount,
    this.sourceType,
    this.externalAccountName,
    this.externalAccountNumber,
    this.externalBankCode,
  });

  factory BankTransaction.fromJson(Map<String, dynamic> json) {
    return BankTransaction(
      id: json['id'] as String? ?? '',
      transactionNumber:
          json['transactionNumber'] as String? ?? json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'TRANSFER',
      status: json['status'] as String? ?? 'COMPLETED',
      amount: (json['amount'] as num).toDouble(),
      fee: (json['fee'] as num?)?.toDouble() ?? 0.0,
      currency: (json['currency'] ?? 'VND') as String? ?? 'VND',
      description: json['description'] as String?,
      createdAt: DateTime.parse(
        json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      processedAt: json['processedAt'] != null
          ? DateTime.parse(
              json['processedAt'] as String? ??
                  DateTime.now().toIso8601String(),
            )
          : DateTime.parse(
              json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
            ),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(
              json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
            )
          : null,
      senderAccountId: json['senderAccountId'] as String?,
      receiverAccountId: json['receiverAccountId'] as String?,
      senderAccount: json['senderAccount'] != null
          ? Account.fromJson(json['senderAccount'] as Map<String, dynamic>)
          : null,
      receiverAccount: json['receiverAccount'] != null
          ? Account.fromJson(json['receiverAccount'] as Map<String, dynamic>)
          : null,
      sourceType: json['sourceType'] as String?,
      externalAccountName: json['externalAccountName'] as String?,
      externalAccountNumber: json['externalAccountNumber'] as String?,
      externalBankCode: json['externalBankCode'] as String?,
    );
  }
}
