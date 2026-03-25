package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EmploymentInfo {
    private String id;
    private String userId;
    private String employmentStatus;
    private String employerName;
    private String employerAddress;
    private String employerPhone;
    private String jobTitle;
    private String department;
    private LocalDateTime employmentDate;
    private Double annualIncome;
    private String sourceOfFunds;
    private Double expectedMonthlyTransactions;
    private String businessName;
    private String businessType;
    private String businessAddress;
    private String businessLicense;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
