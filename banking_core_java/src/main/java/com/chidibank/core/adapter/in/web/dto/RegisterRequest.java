package com.chidibank.core.adapter.in.web.dto;

// import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String studentId;
    @NotBlank
    private String email;
    @NotBlank
    private String password;
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    private String phone;
    private String cohort;
    private String school;
    
    // Personal Information
    private String dateOfBirth;
    private String gender;
    private String nationality;
    
    // Address Information
    private String currentAddress;
    private String permanentAddress;
    private String emergencyContact;
    private String emergencyPhone;
    
    // Terms & Audit
    private boolean termsAccepted;
    private String termsVersion;
    private String ipAddress;
    private String userAgent;
}
