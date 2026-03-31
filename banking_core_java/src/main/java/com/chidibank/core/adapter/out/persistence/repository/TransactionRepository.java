package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, String> {
    List<TransactionEntity> findBySenderAccountIdOrReceiverAccountIdOrderByCreatedAtDesc(String senderAccountId, String receiverAccountId);
    List<TransactionEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<TransactionEntity> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
    @Query("select coalesce(sum(t.amount), 0) from TransactionEntity t where t.status = 'COMPLETED'")
    Double sumCompletedVolume();

    @Query("select coalesce(sum(t.amount), 0) from TransactionEntity t where t.status = 'COMPLETED' "
            + "and t.senderAccount.id = :accountId and t.createdAt >= :since")
    Double sumCompletedOutgoingFromAccountSince(@Param("accountId") String accountId,
            @Param("since") LocalDateTime since);

    Optional<TransactionEntity> findByIdempotencyKey(String idempotencyKey);
}
