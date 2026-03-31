package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.AccountEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, String> {
    Optional<AccountEntity> findByAccountNumber(String accountNumber);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AccountEntity> findWithLockById(String id);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AccountEntity> findWithLockByAccountNumber(String accountNumber);
    List<AccountEntity> findByUserId(String userId);
    List<AccountEntity> findByAccountTypeAndIsActiveTrue(String accountType);
}
