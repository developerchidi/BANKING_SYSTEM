package com.chidibank.core.adapter.in.web;

import com.chidibank.core.adapter.in.web.dto.ApiResponse;
import com.chidibank.core.application.port.in.BankingUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/banking")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BankingController {

    private final BankingUseCase bankingUseCase;

    @GetMapping("/accounts")
    public ResponseEntity<?> getAccounts(Authentication authentication) {
        String studentId = authentication.getName();
        List<Map<String, Object>> accounts = bankingUseCase.getAccounts(studentId);
        return ResponseEntity.ok(Map.of("success", true, "data", accounts));
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<?> getAccountById(Authentication authentication, @PathVariable String accountId) {
        String studentId = authentication.getName();
        Map<String, Object> account = bankingUseCase.getAccountById(studentId, accountId);
        return ResponseEntity.ok(Map.of("success", true, "data", account));
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(Authentication authentication, @RequestBody Map<String, Object> request) {
        String studentId = authentication.getName();
        Map<String, Object> account = bankingUseCase.createAccount(studentId, request);
        return ResponseEntity.ok(Map.of("success", true, "data", account, "message", "Account created successfully"));
    }

    @PutMapping("/accounts/{accountId}/limits")
    public ResponseEntity<?> updateAccountLimits(Authentication authentication, @PathVariable String accountId, @RequestBody Map<String, Object> request) {
        String studentId = authentication.getName();
        bankingUseCase.updateAccountLimits(studentId, accountId, request);
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

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(Authentication authentication, @RequestBody Map<String, Object> request) {
        String studentId = authentication.getName();
        Map<String, Object> response = bankingUseCase.transfer(studentId, request);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @GetMapping("/cards")
    public ResponseEntity<?> getCards(Authentication authentication) {
        String studentId = authentication.getName();
        List<Map<String, Object>> cards = bankingUseCase.getCards(studentId);
        return ResponseEntity.ok(Map.of("success", true, "data", cards));
    }

    @GetMapping("/beneficiaries")
    public ResponseEntity<?> getBeneficiaries(Authentication authentication) {
        String studentId = authentication.getName();
        List<Map<String, Object>> beneficiaries = bankingUseCase.getBeneficiaries(studentId);
        return ResponseEntity.ok(Map.of("success", true, "data", beneficiaries));
    }
}
