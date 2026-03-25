package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.LoginSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoginSessionRepository extends JpaRepository<LoginSessionEntity, String> {
    Optional<LoginSessionEntity> findBySessionToken(String sessionToken);
    Optional<LoginSessionEntity> findByRefreshToken(String refreshToken);
}
