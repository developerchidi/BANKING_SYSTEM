package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.BlacklistedTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedTokenEntity, String> {
    boolean existsByToken(String token);
}
