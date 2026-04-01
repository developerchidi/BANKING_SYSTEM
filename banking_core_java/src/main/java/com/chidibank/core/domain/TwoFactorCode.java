package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TwoFactorCode {
    private String id;
    private String userId;
    private String code;
    private LocalDateTime expiresAt;
    private boolean used;
    private LocalDateTime usedAt;
    private LocalDateTime createdAt;
}
