package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.PasswordResetEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.PasswordResetRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.PasswordResetPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PasswordResetPersistenceAdapter implements PasswordResetPort {

    private final PasswordResetRepository repository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void createResetToken(String userId, String token, LocalDateTime expiresAt) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PasswordResetEntity entity = PasswordResetEntity.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        repository.save(entity);
    }

    @Override
    public boolean verifyToken(String email, String token) {
        return repository.findValidToken(email, token).isPresent();
    }

    @Override
    @Transactional
    public void markAsUsed(String email, String token) {
        Optional<PasswordResetEntity> entityOpt = repository.findValidToken(email, token);
        entityOpt.ifPresent(entity -> {
            entity.setUsed(true);
            entity.setUsedAt(LocalDateTime.now());
            repository.save(entity);
        });
    }
}
