package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AuditLog {
    private String id;
    private String userId;
    private String action;
    private String resource;
    private String resourceId;
    private String details; // JSON String
    private String ipAddress;
    private String userAgent;
    private String sessionId;
    private LocalDateTime createdAt;
}
