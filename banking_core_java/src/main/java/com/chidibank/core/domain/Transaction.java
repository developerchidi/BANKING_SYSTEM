package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Transaction {
    private String id;
    private String transactionNumber;
    private String type;
    private String category;
    private double amount;
    private double fee;
    private String currency;
    private String sourceType;
    private String initiatedBy;
    private String reason;
    private String metadata; // JSON String
    private String description;
    private String reference;
    private String status;
    private String idempotencyKey;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime failedAt;
    private String failureReason;
    private String senderAccountId;
    private String receiverAccountId;
    private String externalBankCode;
    private String externalAccountNumber;
    private String externalAccountName;
    private String userId;
    private String billProvider;
    private String billAccountNumber;
    private LocalDateTime processedAt;
    private String batchId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
