package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class BlacklistedToken {
    private String id;
    private String token;
    private String type;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
