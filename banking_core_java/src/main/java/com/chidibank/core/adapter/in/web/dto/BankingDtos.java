package com.chidibank.core.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

public final class BankingDtos {
    private BankingDtos() {
    }

    @Data
    public static class CreateAccountRequest {
        @NotBlank
        private String accountType;
        @NotBlank
        private String accountName;
        @NotBlank
        private String currency;
    }

    @Data
    public static class UpdateAccountLimitsRequest {
        @NotNull
        @DecimalMin("0.0")
        private Double dailyLimit;
        @NotNull
        @DecimalMin("0.0")
        private Double monthlyLimit;
    }

    @Data
    public static class TransferRequest {
        @NotBlank
        private String fromAccountId;
        @NotBlank
        private String toAccountNumber;
        @NotNull
        @DecimalMin(value = "1.0", message = "Amount must be greater than zero")
        private Double amount;
        private String description;
    }

    @Data
    public static class TransferOtpRequest {
        @NotBlank
        private String transactionId;
        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "otpCode must be 6 digits")
        private String otpCode;
    }

    @Data
    public static class ResendTransferOtpRequest {
        @NotBlank
        private String transactionId;
    }
}
