package com.chidibank.core.application.port.out;

import java.time.LocalDateTime;

public interface LoginSessionPort {
    void createSession(String userId, String accessToken, String refreshToken, String ipAddress, String userAgent, LocalDateTime expiresAt);
}
