package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TermsAcceptance {
    private String id;
    private String userId;
    private String termsVersion;
    private String termsType;
    private String ipAddress;
    private String userAgent;
    private String acceptanceMethod;
    private String deviceInfo;
    private LocalDateTime acceptedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
