package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Transaction;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionPort {
    Transaction saveTransaction(Transaction transaction);
    Optional<Transaction> findById(String id);
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
    List<Transaction> findAll(int page, int limit);
    long countAll();
    double totalVolumeCompleted();
    List<Transaction> findByAccountId(String accountId);
    List<Transaction> findByUserId(String userId);

    /** Tổng đã chuyển đi (COMPLETED) từ tài khoản từ thời điểm since (hạn mức ngày/tháng). */
    double sumCompletedOutgoingFromAccountSince(String accountId, LocalDateTime since);
}
