package com.chidibank.core.adapter.in.web;

import com.chidibank.core.adapter.in.web.dto.AdminDtos;
import com.chidibank.core.application.port.in.AdminUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminUseCase adminUseCase;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = adminUseCase.getSystemStats();
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int limit) {
        Map<String, Object> data = adminUseCase.getAllUsers(page, limit);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody AdminDtos.UpdateUserStatusRequest request) {
        boolean isActive = request.getIsActive() != null && request.getIsActive();
        boolean isLocked = request.getIsLocked() != null && request.getIsLocked();
        adminUseCase.updateUserStatus(userId, isActive, isLocked);
        return ResponseEntity.ok(Map.of("success", true, "message", "User status updated"));
    }

    @PostMapping("/kyc/{userId}/approve")
    public ResponseEntity<?> approveKyc(@PathVariable String userId) {
        adminUseCase.approveKyc(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "KYC Approved"));
    }

    @PostMapping("/kyc/{userId}/reject")
    public ResponseEntity<?> rejectKyc(
            @PathVariable String userId,
            @Valid @RequestBody AdminDtos.RejectKycRequest request) {
        adminUseCase.rejectKyc(userId, request.getReason());
        return ResponseEntity.ok(Map.of("success", true, "message", "KYC Rejected"));
    }
}
