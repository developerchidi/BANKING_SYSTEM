package com.chidibank.core.application.port.out;

import java.time.LocalDateTime;
import java.util.Optional;

public interface LoginSessionPort {

    void createSession(String userId, String accessToken, String refreshToken, String ipAddress, String userAgent,
            LocalDateTime expiresAt);

    Optional<LoginSessionHandle> findActiveByRefreshToken(String refreshToken);

    void updateSessionTokens(String sessionId, String accessToken, String refreshToken, LocalDateTime expiresAt);

    void deactivateSession(String sessionId);

    Optional<LoginSessionHandle> findActiveByAccessToken(String accessToken);
}
