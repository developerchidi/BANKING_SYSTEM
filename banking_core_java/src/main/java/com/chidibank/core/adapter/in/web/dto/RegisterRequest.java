package com.chidibank.core.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String studentId;
    @NotBlank
    @Email
    private String email;
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Password must contain letters and numbers"
    )
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
