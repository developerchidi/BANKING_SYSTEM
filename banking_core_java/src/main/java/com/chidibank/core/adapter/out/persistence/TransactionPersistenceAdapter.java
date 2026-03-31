package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.AccountEntity;
import com.chidibank.core.adapter.out.persistence.entity.TransactionEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.AccountRepository;
import com.chidibank.core.adapter.out.persistence.repository.TransactionRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.TransactionPort;
import com.chidibank.core.domain.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TransactionPersistenceAdapter implements TransactionPort {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Override
    public Transaction saveTransaction(Transaction transaction) {
        AccountEntity sender = transaction.getSenderAccountId() != null 
            ? accountRepository.findById(transaction.getSenderAccountId()).orElse(null) : null;
        AccountEntity receiver = transaction.getReceiverAccountId() != null 
            ? accountRepository.findById(transaction.getReceiverAccountId()).orElse(null) : null;
        UserEntity user = transaction.getUserId() != null 
            ? userRepository.findById(transaction.getUserId()).orElse(null) : null;

        TransactionEntity entity = TransactionEntity.builder()
                .id(transaction.getId())
                .transactionNumber(transaction.getTransactionNumber())
                .type(transaction.getType())
                .category(transaction.getCategory())
                .amount(transaction.getAmount())
                .fee(transaction.getFee())
                .currency(transaction.getCurrency())
                .sourceType(transaction.getSourceType())
                .initiatedBy(transaction.getInitiatedBy())
                .reason(transaction.getReason())
                .description(transaction.getDescription())
                .reference(transaction.getReference())
                .status(transaction.getStatus())
                .idempotencyKey(transaction.getIdempotencyKey())
                .senderAccount(sender)
                .receiverAccount(receiver)
                .externalBankCode(transaction.getExternalBankCode())
                .externalAccountNumber(transaction.getExternalAccountNumber())
                .externalAccountName(transaction.getExternalAccountName())
                .user(user)
                .build();

        TransactionEntity saved = transactionRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<Transaction> findById(String id) {
        return transactionRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public Optional<Transaction> findByIdempotencyKey(String idempotencyKey) {
        return transactionRepository.findByIdempotencyKey(idempotencyKey).map(this::mapToDomain);
    }

    @Override
    public List<Transaction> findAll(int page, int limit) {
        int normalizedPage = Math.max(page - 1, 0);
        int normalizedLimit = Math.max(limit, 1);
        return transactionRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(normalizedPage, normalizedLimit))
                .stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long countAll() {
        return transactionRepository.count();
    }

    @Override
    public double totalVolumeCompleted() {
        return transactionRepository.sumCompletedVolume();
    }

    @Override
    public List<Transaction> findByAccountId(String accountId) {
        return transactionRepository.findBySenderAccountIdOrReceiverAccountIdOrderByCreatedAtDesc(accountId, accountId)
                .stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Transaction> findByUserId(String userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public double sumCompletedOutgoingFromAccountSince(String accountId, LocalDateTime since) {
        Double v = transactionRepository.sumCompletedOutgoingFromAccountSince(accountId, since);
        return v != null ? v : 0.0;
    }

    private Transaction mapToDomain(TransactionEntity entity) {
        return Transaction.builder()
                .id(entity.getId())
                .transactionNumber(entity.getTransactionNumber())
                .type(entity.getType())
                .category(entity.getCategory())
                .amount(entity.getAmount())
                .fee(entity.getFee())
                .currency(entity.getCurrency())
                .sourceType(entity.getSourceType())
                .initiatedBy(entity.getInitiatedBy())
                .reason(entity.getReason())
                .description(entity.getDescription())
                .reference(entity.getReference())
                .status(entity.getStatus())
                .idempotencyKey(entity.getIdempotencyKey())
                .senderAccountId(entity.getSenderAccount() != null ? entity.getSenderAccount().getId() : null)
                .receiverAccountId(entity.getReceiverAccount() != null ? entity.getReceiverAccount().getId() : null)
                .externalBankCode(entity.getExternalBankCode())
                .externalAccountNumber(entity.getExternalAccountNumber())
                .externalAccountName(entity.getExternalAccountName())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
