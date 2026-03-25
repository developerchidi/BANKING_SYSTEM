package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Beneficiary {
    private String id;
    private String userId;
    private String accountId;
    private String name;
    private String nickname;
    private String bankCode;
    private String accountNumber;
    private String accountName;
    private String bankName;
    private String relationship;
    private Double dailyLimit;
    private Double monthlyLimit;
    private boolean isActive;
    private boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
