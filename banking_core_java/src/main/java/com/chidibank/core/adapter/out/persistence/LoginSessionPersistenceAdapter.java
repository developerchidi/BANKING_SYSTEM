package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.LoginSessionEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.LoginSessionRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.LoginSessionPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

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
}
