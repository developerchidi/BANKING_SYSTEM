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
    private LocalDateTime idIssueDate;
    private String idIssuePlace;
    private LocalDateTime idExpiryDate;
    private String studentId;
    private String cohort;
    private String school;
    private String currentAddress;
    private String permanentAddress;
    private String emergencyContact;
    private String emergencyPhone;
    private String maritalStatus;
    private Integer dependents;
    private String educationLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
