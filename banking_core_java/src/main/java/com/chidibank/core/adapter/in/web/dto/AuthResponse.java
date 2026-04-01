package com.chidibank.core.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private boolean success;
    private String message;
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    
    private UserData user;
    private Object data;

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserData {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String phone;
        private boolean isEmailVerified;
        private boolean isKycVerified;
        private String kycStatus;
        private boolean isActive;
        private String accountTier;
        private LocalDateTime dateOfBirth;
        private LocalDateTime createdAt;
    }
}
