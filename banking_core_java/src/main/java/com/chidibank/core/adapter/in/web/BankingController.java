package com.chidibank.core.adapter.in.web;

import com.chidibank.core.adapter.in.web.dto.ApiResponse;
import com.chidibank.core.adapter.in.web.dto.BankingDtos;
import com.chidibank.core.application.port.in.BankingUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/banking", "/api/v1/banking"})
@RequiredArgsConstructor
public class BankingController {

    private final BankingUseCase bankingUseCase;

    @GetMapping("/accounts")
    public ResponseEntity<?> getAccounts(Authentication authentication) {
        String studentId = authentication.getName();
        List<Map<String, Object>> accounts = bankingUseCase.getAccounts(studentId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Accounts retrieved successfully",
            "data", Map.of("accounts", accounts)
        ));
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<?> getAccountById(Authentication authentication, @PathVariable String accountId) {
        String studentId = authentication.getName();
        Map<String, Object> account = bankingUseCase.getAccountById(studentId, accountId);
        return ResponseEntity.ok(Map.of("success", true, "data", account));
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(
            Authentication authentication,
            @Valid @RequestBody BankingDtos.CreateAccountRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> account = bankingUseCase.createAccount(studentId, Map.of(
                "accountType", request.getAccountType(),
                "accountName", request.getAccountName(),
                "currency", request.getCurrency()
        ));
        return ResponseEntity.ok(Map.of("success", true, "data", account, "message", "Account created successfully"));
    }

    @PutMapping("/accounts/{accountId}/limits")
    public ResponseEntity<?> updateAccountLimits(
            Authentication authentication,
            @PathVariable String accountId,
            @Valid @RequestBody BankingDtos.UpdateAccountLimitsRequest request) {
        String studentId = authentication.getName();
        bankingUseCase.updateAccountLimits(studentId, accountId, Map.of(
                "dailyLimit", request.getDailyLimit(),
                "monthlyLimit", request.getMonthlyLimit()
        ));
        return ResponseEntity.ok(new ApiResponse(true, "Limits updated successfully"));
    }

    @GetMapping("/accounts/{accountId}/transactions")
    public ResponseEntity<?> getAccountTransactions(
            Authentication authentication, 
            @PathVariable String accountId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        String studentId = authentication.getName();
        Map<String, Object> data = bankingUseCase.getTransactions(studentId, accountId, page, limit);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getUserTransactions(
            Authentication authentication,
            @RequestParam Map<String, Object> allParams) {
        String studentId = authentication.getName();
        Map<String, Object> data = bankingUseCase.getUserTransactions(studentId, allParams);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/verify-account/{accountNumber}")
    public ResponseEntity<?> verifyAccount(@PathVariable String accountNumber) {
        Map<String, Object> data = bankingUseCase.verifyAccount(accountNumber);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> getDashboardSummary(Authentication authentication) {
        String studentId = authentication.getName();
        Map<String, Object> data = bankingUseCase.getDashboardSummary(studentId);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(
            Authentication authentication,
            @Valid @RequestBody BankingDtos.TransferRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> response = bankingUseCase.transfer(studentId, Map.of(
                "fromAccountId", request.getFromAccountId(),
                "toAccountNumber", request.getToAccountNumber(),
                "amount", request.getAmount(),
                "description", request.getDescription()
        ));
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PostMapping("/transfer/verify-otp")
    public ResponseEntity<?> verifyOtp(
            Authentication authentication,
            @Valid @RequestBody BankingDtos.TransferOtpRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> response = bankingUseCase.verifyTransferOtp(studentId, Map.of(
                "transactionId", request.getTransactionId(),
                "otpCode", request.getOtpCode()
        ));
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PostMapping("/transfer/resend-otp")
    public ResponseEntity<?> resendOtp(
            Authentication authentication,
            @Valid @RequestBody BankingDtos.ResendTransferOtpRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> response = bankingUseCase.resendTransferOtp(studentId, Map.of(
                "transactionId", request.getTransactionId()
        ));
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @GetMapping("/beneficiaries")
    public ResponseEntity<?> getBeneficiaries(Authentication authentication) {
        String studentId = authentication.getName();
        List<Map<String, Object>> beneficiaries = bankingUseCase.getBeneficiaries(studentId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of("beneficiaries", beneficiaries)
        ));
    }
}
