package com.chidibank.core.application.port.out;

import java.time.LocalDateTime;

public interface TokenBlacklistPort {

    void blacklistAccessToken(String token, LocalDateTime expiresAt);

    boolean isBlacklisted(String token);
}
