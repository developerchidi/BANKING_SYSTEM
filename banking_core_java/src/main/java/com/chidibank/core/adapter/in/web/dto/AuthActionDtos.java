package com.chidibank.core.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public final class AuthActionDtos {
    private AuthActionDtos() {
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank
        @Email
        private String email;
    }

    @Data
    public static class VerifyResetCodeRequest {
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String token;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String token;
        @NotBlank
        private String newPassword;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;
        @NotBlank
        private String newPassword;
    }
}
