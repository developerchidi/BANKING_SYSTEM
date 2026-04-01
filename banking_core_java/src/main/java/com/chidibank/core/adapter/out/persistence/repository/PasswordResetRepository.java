package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.PasswordResetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordResetEntity, String> {
    
    @Query("SELECT p FROM PasswordResetEntity p WHERE p.user.email = :email AND p.token = :token AND p.used = false AND p.expiresAt > CURRENT_TIMESTAMP ORDER BY p.createdAt DESC")
    Optional<PasswordResetEntity> findValidToken(@Param("email") String email, @Param("token") String token);
}
