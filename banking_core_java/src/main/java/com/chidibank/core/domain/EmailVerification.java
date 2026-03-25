package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EmailVerification {
    private String id;
    private String userId;
    private String token;
    private LocalDateTime expiresAt;
    private boolean isUsed;
    private LocalDateTime usedAt;
    private LocalDateTime createdAt;
}
