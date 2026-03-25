package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, String> {
    List<TransactionEntity> findBySenderAccountIdOrReceiverAccountIdOrderByCreatedAtDesc(String senderAccountId, String receiverAccountId);
    List<TransactionEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
