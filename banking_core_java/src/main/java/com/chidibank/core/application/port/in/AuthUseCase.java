package com.chidibank.core.application.port.in;

import com.chidibank.core.adapter.in.web.dto.AuthRequest;
import com.chidibank.core.adapter.in.web.dto.AuthResponse;
import com.chidibank.core.adapter.in.web.dto.RegisterRequest;
import com.chidibank.core.domain.User;

public interface AuthUseCase {
    AuthResponse login(AuthRequest request);
    User register(RegisterRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String accessToken);
    void forgotPassword(String email);
    boolean verifyResetCode(String email, String token);
    void resetPassword(String email, String token, String newPassword);
    void changePassword(String studentId, String currentPassword, String newPassword);
    void verifyEmail(String token);
    AuthResponse getMe(String studentId);
    
    boolean checkEmailExists(String email);
    boolean checkPhoneExists(String phone);
    boolean checkStudentIdExists(String studentId);
}
