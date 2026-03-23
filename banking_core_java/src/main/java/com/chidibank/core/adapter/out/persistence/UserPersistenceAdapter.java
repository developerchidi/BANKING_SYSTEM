package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserPort {

    private final UserRepository userRepository;

    @Override
    public User saveUser(User domainUser) {
        UserEntity entity = UserEntity.builder()
                .email(domainUser.getEmail())
                .password(domainUser.getPassword())
                .firstName(domainUser.getFirstName())
                .lastName(domainUser.getLastName())
                .phone(domainUser.getPhone())
                .isActive(domainUser.isActive())
                .accountTier(domainUser.getAccountTier())
                .build();
        if (domainUser.getId() != null) {
            entity.setId(domainUser.getId());
        }
        
        UserEntity saved = userRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email).map(this::mapToDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    private User mapToDomain(UserEntity entity) {
        return User.builder()
                .id(entity.getId())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .password(entity.getPassword())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .isActive(entity.isActive())
                .accountTier(entity.getAccountTier())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
