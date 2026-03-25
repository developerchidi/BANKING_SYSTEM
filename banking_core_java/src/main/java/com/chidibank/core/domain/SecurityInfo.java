package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SecurityInfo {
    private String id;
    private String userId;
    private String securityQuestions; // JSON String
    private String trustedDevices; // JSON String
    private String lastDeviceInfo; // JSON String
    private LocalDateTime passwordLastChanged;
    private boolean requirePasswordChange;
    private Integer sessionTimeout;
    private String transactionPinHash;
    private LocalDateTime pinUpdatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
