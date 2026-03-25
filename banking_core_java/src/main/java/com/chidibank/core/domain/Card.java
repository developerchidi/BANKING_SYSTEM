package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Card {
    private String id;
    private String cardNumber;
    private String cardType;
    private String cardBrand;
    private int expiryMonth;
    private int expiryYear;
    private String cvv;
    private String cardholderName;
    private boolean isActive;
    private boolean isBlocked;
    private String blockReason;
    private Double dailyLimit;
    private Double monthlyLimit;
    private Double atmDailyLimit;
    private String pinHash;
    private int pinAttempts;
    private LocalDateTime pinLockedUntil;
    private String userId;
    private String accountId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
