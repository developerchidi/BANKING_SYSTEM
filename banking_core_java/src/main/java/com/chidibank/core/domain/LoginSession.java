package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class LoginSession {
    private String id;
    private String userId;
    private String sessionToken;
    private String refreshToken;
    private LocalDateTime expiresAt;
    private boolean isActive;
    private String deviceInfo; // JSON String
    private String ipAddress;
    private String userAgent;
    private String location;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
