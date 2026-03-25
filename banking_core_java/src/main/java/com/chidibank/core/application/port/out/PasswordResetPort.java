package com.chidibank.core.application.port.out;

import java.time.LocalDateTime;

public interface PasswordResetPort {
    void createResetToken(String userId, String token, LocalDateTime expiresAt);
    boolean verifyToken(String email, String token);
    void markAsUsed(String email, String token);
}
