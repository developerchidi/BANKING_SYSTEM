package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Interest {
    private String id;
    private String userId;
    private String accountId;
    private String interestType;
    private Double interestRate;
    private Double principalAmount;
    private Double interestAmount;
    private Double totalAmount;
    private LocalDateTime calculationDate;
    private LocalDateTime createdAt;
}
