package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserProfile {
    private String id;
    private String userId;
    private String idNumber;
    private String idType;
    private String currentAddress;
    private String permanentAddress;
    private String emergencyContact;
    private String emergencyPhone;
    private LocalDateTime createdAt;
}
