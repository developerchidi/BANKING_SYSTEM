package com.chidibank.core.domain;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Account {
    private String id;
    private String accountNumber;
    private String accountType;
    private String accountName;
    private String currency;
    private double balance;
    private double availableBalance;
    private boolean isActive;
    private boolean isFrozen;
    private Double dailyLimit;
    private Double monthlyLimit;
    private Double interestRate;
    private LocalDateTime lastInterestDate;
    private String userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
