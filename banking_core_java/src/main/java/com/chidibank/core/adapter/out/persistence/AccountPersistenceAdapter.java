package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.AccountEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.AccountRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.domain.Account;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AccountPersistenceAdapter implements AccountPort {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Override
    public void createDefaultAccount(String userId, String firstName, String lastName) {
        UserEntity user = userRepository.findById(userId).orElseThrow();
        
        AccountEntity account = AccountEntity.builder()
                .user(user)
                .accountNumber(generateAccountNumber())
                .accountType("CHECKING") // BANKING_CONSTANTS.ACCOUNT_TYPES.CHECKING
                .accountName(firstName + " " + lastName)
                .currency("VND")
                .balance(0.0)
                .availableBalance(0.0)
                .isActive(true)
                .isFrozen(false)
                .build();
        
        accountRepository.save(account);
    }

    private String generateAccountNumber() {
        return String.valueOf(System.currentTimeMillis()).substring(2); // Basic mockup implementation
    }

    @Override
    public Account saveAccount(Account account) {
        UserEntity user = userRepository.findById(account.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + account.getUserId()));

        AccountEntity entity = AccountEntity.builder()
                .id(account.getId())
                .user(user)
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType())
                .accountName(account.getAccountName())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .availableBalance(account.getAvailableBalance())
                .isActive(account.isActive())
                .isFrozen(account.isFrozen())
                .dailyLimit(account.getDailyLimit())
                .monthlyLimit(account.getMonthlyLimit())
                .interestRate(account.getInterestRate())
                .lastInterestDate(account.getLastInterestDate())
                .build();

        AccountEntity saved = accountRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<Account> findById(String id) {
        return accountRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public Optional<Account> findByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber).map(this::mapToDomain);
    }

    @Override
    public List<Account> findByUserId(String userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    private Account mapToDomain(AccountEntity entity) {
        return Account.builder()
                .id(entity.getId())
                .accountNumber(entity.getAccountNumber())
                .accountType(entity.getAccountType())
                .accountName(entity.getAccountName())
                .currency(entity.getCurrency())
                .balance(entity.getBalance())
                .availableBalance(entity.getAvailableBalance())
                .isActive(entity.isActive())
                .isFrozen(entity.isFrozen())
                .dailyLimit(entity.getDailyLimit())
                .monthlyLimit(entity.getMonthlyLimit())
                .interestRate(entity.getInterestRate())
                .lastInterestDate(entity.getLastInterestDate())
                .userId(entity.getUser().getId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
