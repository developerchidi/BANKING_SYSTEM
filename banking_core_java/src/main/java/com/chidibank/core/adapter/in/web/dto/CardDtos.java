package com.chidibank.core.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

public final class CardDtos {
    private CardDtos() {
    }

    @Data
    public static class CreateCardRequest {
        @NotBlank
        private String accountId;
        @NotBlank
        private String cardType;
        @NotBlank
        @Pattern(regexp = "\\d{4}", message = "PIN must be exactly 4 digits")
        private String pin;
    }

    @Data
    public static class UpdateCardStatusRequest {
        private Boolean isActive;
        private Boolean isBlocked;
        private String blockReason;
    }

    @Data
    public static class UpdateCardPinRequest {
        @NotBlank
        @Pattern(regexp = "\\d{4}", message = "PIN must be exactly 4 digits")
        private String pin;
    }

    @Data
    public static class UpdateCardLimitsRequest {
        @NotNull
        @DecimalMin("0.0")
        private Double dailyLimit;
        @NotNull
        @DecimalMin("0.0")
        private Double monthlyLimit;
    }
}
