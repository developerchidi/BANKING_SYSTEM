package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class LoginHistory {
    private String id;
    private String userId;
    private LocalDateTime loginTime;
    private String loginLocation;
    private String ipAddress;
    private String userAgent;
    private String deviceInfo; // JSON String
    private boolean success;
    private String failureReason;
    private boolean twoFactorUsed;
}
