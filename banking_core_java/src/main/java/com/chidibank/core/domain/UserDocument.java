package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserDocument {
    private String id;
    private String userId;
    private String documentType;
    private String documentUrl;
    private String documentName;
    private Integer fileSize;
    private String mimeType;
    private String idNumber;
    private String verificationStatus;
    private String verificationNotes;
    private String verifiedBy;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
