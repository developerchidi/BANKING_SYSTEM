package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class KYCRequest {
    private String id;
    private String userId;
    private String documentType;
    private String status;
    private String frontImage; // Base64 or URL
    private String backImage;
    private String selfieImage;
    private String extractedData; // JSON String
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
