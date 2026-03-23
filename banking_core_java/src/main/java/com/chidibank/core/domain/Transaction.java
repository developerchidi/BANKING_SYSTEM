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
    private String description;
    private String status;
    private String senderAccountId;
    private String receiverAccountId;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
