package com.chidibank.core.application.service;

import com.chidibank.core.adapter.in.web.dto.AuthRequest;
import com.chidibank.core.adapter.in.web.dto.AuthResponse;
import com.chidibank.core.adapter.in.web.dto.RegisterRequest;
import com.chidibank.core.application.port.in.AuthUseCase;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.LoginSessionPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.out.TermsAcceptancePort;
import com.chidibank.core.application.port.out.PasswordResetPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.application.port.out.UserProfilePort;
import com.chidibank.core.domain.User;
import com.chidibank.core.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthUseCase {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserPort userPort;
    private final AccountPort accountPort;
    private final UserProfilePort profilePort;
    private final LoginSessionPort sessionPort;
    private final TermsAcceptancePort termsPort;
    private final AuditLogPort auditLogPort;
    private final PasswordResetPort resetPort;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(AuthRequest request) {
        // 1. Check if user exists and is locked
        User user = userPort.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException(
                        "Invalid student ID or password"));

        if (user.isLocked() && user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Account is locked. Please try again after " + user.getLockedUntil());
        }

        try {
            // 2. Authenticate
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getStudentId(), request.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. Reset failed attempts on success
            userPort.resetFailedAttempts(request.getStudentId());

            // 4. Generate tokens
            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            // 5. Create Login Session
            sessionPort.createSession(
                    user.getId(),
                    accessToken,
                    refreshToken,
                    "unknown", // Could be passed from controller
                    "unknown",
                    LocalDateTime.now().plusDays(7));

            return AuthResponse.builder()
                    .success(true)
                    .message("Login successful")
                    .user(AuthResponse.UserData.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .isEmailVerified(user.isEmailVerified())
                            .isKycVerified(user.isKycVerified())
                            .kycStatus(user.getKycStatus())
                            .isActive(user.isActive())
                            .createdAt(user.getCreatedAt())
                            .build())
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();

        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            // 6. Handle failed attempt
            userPort.incrementFailedAttempts(request.getStudentId());
            throw e;
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public User register(RegisterRequest request) {
        // 1. Validation
        if (userPort.existsByStudentId(request.getStudentId())) {
            throw new RuntimeException("Student ID already registered");
        }

        if (userPort.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // 2. Create User
        User newUser = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .dateOfBirth(
                        request.getDateOfBirth() != null ? LocalDateTime.parse(request.getDateOfBirth() + "T00:00:00")
                                : null)
                .gender(request.getGender())
                .nationality(request.getNationality())
                .displayCurrency("VND")
                .isActive(true)
                .accountTier("BASIC")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userPort.saveUser(newUser);

        // 3. Create User Profile
        profilePort.createProfile(
                savedUser.getId(),
                request.getStudentId(),
                request.getCohort(),
                request.getSchool(),
                request.getCurrentAddress(),
                request.getPermanentAddress(),
                request.getEmergencyContact(),
                request.getEmergencyPhone());

        // 4. Create Default Account
        accountPort.createDefaultAccount(savedUser.getId(), savedUser.getFirstName(), savedUser.getLastName());

        // 5. Create Terms Acceptance
        if (request.isTermsAccepted()) {
            termsPort.createAcceptance(
                    savedUser.getId(),
                    request.getTermsVersion() != null ? request.getTermsVersion() : "1.0",
                    "REGISTRATION",
                    request.getIpAddress(),
                    request.getUserAgent());
        }

        // 6. Create Audit Log
        auditLogPort.createAuditLog(
                savedUser.getId(),
                "USER_REGISTERED",
                "users",
                savedUser.getId(),
                String.format("Email: %s, Name: %s %s", savedUser.getEmail(), savedUser.getFirstName(),
                        savedUser.getLastName()));

        return savedUser;
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String username = tokenProvider.getUsernameFromRefreshToken(refreshToken);
        User user = userPort.findByStudentId(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // In a real app, check if refreshToken is blacklisted or belongs to this user

        String newAccessToken = tokenProvider.generateAccessToken(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(username, null,
                        java.util.Collections.emptyList()));
        String newRefreshToken = tokenProvider.generateRefreshToken(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(username, null,
                        java.util.Collections.emptyList()));

        return AuthResponse.builder()
                .success(true)
                .message("Token refreshed")
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(AuthResponse.UserData.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .isEmailVerified(user.isEmailVerified())
                        .isKycVerified(user.isKycVerified())
                        .kycStatus(user.getKycStatus())
                        .isActive(user.isActive())
                        .createdAt(user.getCreatedAt())
                        .build())
                .build();
    }

    @Override
    public void logout(String accessToken) {
        // Implementation for blacklisting token would go here
        SecurityContextHolder.clearContext();
    }

    @Override
    public void forgotPassword(String email) {
        User user = userPort.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        String resetCode = String.valueOf(100000 + new java.util.Random().nextInt(900000));
        System.out.println("DEBUG: Password reset code for " + email + " is " + resetCode);

        // Save to DB
        resetPort.createResetToken(user.getId(), resetCode, LocalDateTime.now().plusMinutes(15));
    }

    @Override
    public boolean verifyResetCode(String email, String token) {
        return resetPort.verifyToken(email, token);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void resetPassword(String email, String token, String newPassword) {
        if (!verifyResetCode(email, token)) {
            throw new RuntimeException("Invalid or expired reset code");
        }

        User user = userPort.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userPort.saveUser(user);

        resetPort.markAsUsed(email, token);

        auditLogPort.createAuditLog(user.getId(), "PASSWORD_RESET", "users", user.getId(),
                "Password reset successfully using code");
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void changePassword(String studentId, String currentPassword, String newPassword) {
        User user = userPort.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userPort.saveUser(user);

        auditLogPort.createAuditLog(user.getId(), "PASSWORD_CHANGED", "users", user.getId(),
                "User changed password successfully");
    }

    @Override
    public void verifyEmail(String token) {
        // Implementation for email verification
    }

    @Override
    public AuthResponse getMe(String studentId) {
        User user = userPort.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AuthResponse.UserData userData = AuthResponse.UserData.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .isEmailVerified(user.isEmailVerified())
                .isKycVerified(user.isKycVerified())
                .kycStatus(user.getKycStatus())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();

        return AuthResponse.builder()
                .success(true)
                .message("User profile retrieved successfully")
                .data(userData)
                .build();
    }

    @Override
    public boolean checkEmailExists(String email) {
        return userPort.existsByEmail(email);
    }

    @Override
    public boolean checkPhoneExists(String phone) {
        return userPort.existsByPhone(phone);
    }

    @Override
    public boolean checkStudentIdExists(String studentId) {
        return userPort.existsByStudentId(studentId);
    }
}
