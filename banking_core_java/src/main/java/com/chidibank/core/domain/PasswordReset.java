package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class PasswordReset {
    private String id;
    private String userId;
    private String token;
    private LocalDateTime expiresAt;
    private LocalDateTime usedAt;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
