package com.chidibank.core.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public final class AdminDtos {
    private AdminDtos() {
    }

    @Data
    public static class UpdateUserStatusRequest {
        private Boolean isActive = true;
        private Boolean isLocked = false;
    }

    @Data
    public static class RejectKycRequest {
        @NotBlank
        private String reason;
    }
}
