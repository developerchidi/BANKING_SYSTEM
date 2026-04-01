package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Notification {
    private String id;
    private String userId;
    private String senderId;
    private String title;
    private String content;
    private String type; // TRANSACTION, SECURITY, PROMOTION, SYSTEM
    private String status; // SENT, DELIVERED, READ, ARCHIVED
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String metadata; // JSON String
    private String actionUrl;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
