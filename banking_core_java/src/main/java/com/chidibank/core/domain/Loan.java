package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Loan {
    private String id;
    private String loanNumber;
    private String loanType;
    private double amount;
    private double interestRate;
    private int termMonths;
    private String status;
    private double remainingBalance;
    private String userId;
    private String accountId;
    private LocalDateTime createdAt;
}
