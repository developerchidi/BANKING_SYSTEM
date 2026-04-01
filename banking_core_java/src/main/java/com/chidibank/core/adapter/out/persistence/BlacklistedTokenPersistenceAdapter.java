package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.BlacklistedTokenEntity;
import com.chidibank.core.adapter.out.persistence.repository.BlacklistedTokenRepository;
import com.chidibank.core.application.port.out.TokenBlacklistPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class BlacklistedTokenPersistenceAdapter implements TokenBlacklistPort {

    private final BlacklistedTokenRepository repository;

    @Override
    @Transactional
    public void blacklistAccessToken(String token, LocalDateTime expiresAt) {
        if (token == null || token.isEmpty() || repository.existsByToken(token)) {
            return;
        }
        repository.save(BlacklistedTokenEntity.builder()
                .token(token)
                .type("ACCESS")
                .expiresAt(expiresAt)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isBlacklisted(String token) {
        return token != null && repository.existsByToken(token);
    }
}
