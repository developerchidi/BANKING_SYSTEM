package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Transaction;
import java.util.List;
import java.util.Optional;

public interface TransactionPort {
    Transaction saveTransaction(Transaction transaction);
    Optional<Transaction> findById(String id);
    List<Transaction> findByAccountId(String accountId);
    List<Transaction> findByUserId(String userId);
}
