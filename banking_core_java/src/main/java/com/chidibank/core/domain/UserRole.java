package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserRole {
    private String id;
    private String userId;
    private String roleId;
    private String assignedBy;
    private LocalDateTime assignedAt;
    private LocalDateTime expiresAt;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
