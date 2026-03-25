package com.chidibank.core.adapter.in.web;

import com.chidibank.core.adapter.in.web.dto.ApiResponse;
import com.chidibank.core.application.port.in.UserUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserUseCase userUseCase;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String studentId = authentication.getName();
        Map<String, Object> data = userUseCase.getProfile(studentId);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody Map<String, Object> request) {
        String studentId = authentication.getName();
        Map<String, Object> data = userUseCase.updateProfile(studentId, request);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/kyc-status")
    public ResponseEntity<?> getKycStatus(Authentication authentication) {
        String studentId = authentication.getName();
        Map<String, Object> data = userUseCase.getKycStatus(studentId);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @PutMapping("/display-currency")
    public ResponseEntity<?> updateDisplayCurrency(Authentication authentication, @RequestBody Map<String, String> request) {
        String studentId = authentication.getName();
        String currency = request.get("displayCurrency");
        if (currency == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "displayCurrency is required"));
        }
        
        java.util.List<String> validCurrencies = java.util.Arrays.asList("VND", "USD", "EUR", "JPY");
        if (!validCurrencies.contains(currency)) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid currency code"));
        }
        
        Map<String, Object> data = userUseCase.updateDisplayCurrency(studentId, currency);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }
    
    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(Authentication authentication) {
        // Stub for getPreferences
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("language", "vi", "theme", "light", "notifications", true)));
    }
    
    @PostMapping("/kyc")
    public ResponseEntity<?> submitKyc(Authentication authentication) {
        // Stub for submitKyc
        return ResponseEntity.ok(new ApiResponse(true, "KYC submitted (TODO)"));
    }
    
    @PostMapping("/deactivate")
    public ResponseEntity<?> deactivateAccount(Authentication authentication) {
        // Stub for deactivate
        return ResponseEntity.ok(new ApiResponse(true, "Account deactivated (TODO)"));
    }
}
