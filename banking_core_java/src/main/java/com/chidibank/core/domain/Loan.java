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
    private Double disbursedAmount;
    private LocalDateTime disbursedAt;
    private Double monthlyPayment;
    private Double totalInterest;
    private Double remainingBalance;
    private LocalDateTime nextPaymentDate;
    private String userId;
    private String accountId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
