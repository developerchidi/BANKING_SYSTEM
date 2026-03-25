package com.chidibank.core.adapter.in.web;

import com.chidibank.core.adapter.in.web.dto.ApiResponse;
import com.chidibank.core.adapter.in.web.dto.AuthRequest;
import com.chidibank.core.adapter.in.web.dto.AuthResponse;
import com.chidibank.core.adapter.in.web.dto.RegisterRequest;
import com.chidibank.core.application.port.in.AuthUseCase;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.chidibank.core.domain.User;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthUseCase authUseCase;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authUseCase.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        User user = authUseCase.register(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User registered successfully",
                "data", Map.of(
                        "userId", user.getId(),
                        "email", user.getEmail(),
                        "firstName", user.getFirstName(),
                        "lastName", user.getLastName(),
                        "isEmailVerified", user.isEmailVerified(),
                        "isKycVerified", user.isKycVerified(),
                        "kycStatus", user.getKycStatus(),
                        "isActive", user.isActive(),
                        "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
                )
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestParam String refreshToken) {
        return ResponseEntity.ok(authUseCase.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        authUseCase.logout(token.replace("Bearer ", ""));
        return ResponseEntity.ok().body(new ApiResponse(true, "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        authUseCase.forgotPassword(email);
        return ResponseEntity.ok().body(new ApiResponse(true, "Password reset code sent to your email"));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String token = request.get("token");
        boolean isValid = authUseCase.verifyResetCode(email, token);
        if (isValid) {
            return ResponseEntity.ok().body(new ApiResponse(true, "Reset code verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid or expired reset code"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        authUseCase.resetPassword(email, token, newPassword);
        return ResponseEntity.ok().body(new ApiResponse(true, "Password has been reset successfully"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            org.springframework.security.core.Authentication authentication,
            @RequestBody Map<String, String> request) {
        String studentId = authentication.getName();
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        authUseCase.changePassword(studentId, currentPassword, newPassword);
        return ResponseEntity.ok().body(new ApiResponse(true, "Mật khẩu đã được đổi thành công"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        authUseCase.verifyEmail(token);
        return ResponseEntity.ok().body(new ApiResponse(true, "Email verified successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(org.springframework.security.core.Authentication authentication) {
        String studentId = authentication.getName();
        return ResponseEntity.ok(authUseCase.getMe(studentId));
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailExists(@RequestParam String email) {
        boolean exists = authUseCase.checkEmailExists(email);
        return ResponseEntity.ok(Map.of(
                "exists", exists,
                "message", exists ? "Email already exists" : "Email is available"
        ));
    }

    @GetMapping("/check-phone")
    public ResponseEntity<?> checkPhoneExists(@RequestParam String phone) {
        boolean exists = authUseCase.checkPhoneExists(phone);
        return ResponseEntity.ok(Map.of(
                "exists", exists,
                "message", exists ? "Phone number already exists" : "Phone number is available"
        ));
    }

    @GetMapping("/check-student-id")
    public ResponseEntity<?> checkStudentIdExists(@RequestParam String studentId) {
        boolean exists = authUseCase.checkStudentIdExists(studentId);
        return ResponseEntity.ok(Map.of(
                "exists", exists,
                "message", exists ? "Student ID already exists" : "Student ID is available"
        ));
    }

}
