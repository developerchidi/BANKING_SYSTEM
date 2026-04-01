package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class InterestRate {
    private String id;
    private String accountType;
    private String tier;
    private Double annualRate;
    private Double minimumBalance;
    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
