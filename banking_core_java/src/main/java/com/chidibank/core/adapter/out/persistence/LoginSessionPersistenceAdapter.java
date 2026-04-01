package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.LoginSessionEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.LoginSessionRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.LoginSessionHandle;
import com.chidibank.core.application.port.out.LoginSessionPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class LoginSessionPersistenceAdapter implements LoginSessionPort {

    private final LoginSessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Override
    public void createSession(String userId, String accessToken, String refreshToken, String ipAddress, String userAgent, LocalDateTime expiresAt) {
        UserEntity user = userRepository.findById(userId).orElseThrow();
        
        LoginSessionEntity session = LoginSessionEntity.builder()
                .user(user)
                .sessionToken(accessToken)
                .refreshToken(refreshToken)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .expiresAt(expiresAt)
                .isActive(true)
                .build();
        
        sessionRepository.save(session);
    }

    @Override
    public Optional<LoginSessionHandle> findActiveByRefreshToken(String refreshToken) {
        return sessionRepository.findByRefreshToken(refreshToken)
                .filter(LoginSessionEntity::isActive)
                .map(e -> new LoginSessionHandle(e.getId(), e.getUser().getId()));
    }

    @Override
    public void updateSessionTokens(String sessionId, String accessToken, String refreshToken, LocalDateTime expiresAt) {
        LoginSessionEntity e = sessionRepository.findById(sessionId).orElseThrow();
        e.setSessionToken(accessToken);
        e.setRefreshToken(refreshToken);
        e.setExpiresAt(expiresAt);
        sessionRepository.save(e);
    }

    @Override
    public void deactivateSession(String sessionId) {
        sessionRepository.findById(sessionId).ifPresent(s -> {
            s.setActive(false);
            sessionRepository.save(s);
        });
    }

    @Override
    public Optional<LoginSessionHandle> findActiveByAccessToken(String accessToken) {
        return sessionRepository.findBySessionToken(accessToken)
                .filter(LoginSessionEntity::isActive)
                .map(e -> new LoginSessionHandle(e.getId(), e.getUser().getId()));
    }
}
