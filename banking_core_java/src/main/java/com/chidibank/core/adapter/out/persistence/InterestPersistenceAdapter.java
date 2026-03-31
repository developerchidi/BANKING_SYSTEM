package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.AccountEntity;
import com.chidibank.core.adapter.out.persistence.entity.InterestEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.AccountRepository;
import com.chidibank.core.adapter.out.persistence.repository.InterestRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.InterestPort;
import com.chidibank.core.domain.Interest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class InterestPersistenceAdapter implements InterestPort {

    private final InterestRepository interestRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Override
    public Interest saveInterest(Interest interest) {
        AccountEntity account = accountRepository.findById(interest.getAccountId())
                .orElseThrow(() -> new RuntimeException("Account not found: " + interest.getAccountId()));
        
        UserEntity user = userRepository.findById(interest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + interest.getUserId()));

        InterestEntity entity = InterestEntity.builder()
                .id(interest.getId())
                .user(user)
                .account(account)
                .interestType(interest.getInterestType())
                .interestRate(interest.getInterestRate())
                .principalAmount(interest.getPrincipalAmount())
                .interestAmount(interest.getInterestAmount())
                .totalAmount(interest.getTotalAmount())
                .calculationDate(interest.getCalculationDate())
                .periodStart(interest.getPeriodStart())
                .periodEnd(interest.getPeriodEnd())
                .status(interest.getStatus())
                .build();

        InterestEntity saved = interestRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public List<Interest> findByAccountId(String accountId) {
        return interestRepository.findByAccountId(accountId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    private Interest mapToDomain(InterestEntity entity) {
        return Interest.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .accountId(entity.getAccount().getId())
                .interestType(entity.getInterestType())
                .interestRate(entity.getInterestRate())
                .principalAmount(entity.getPrincipalAmount())
                .interestAmount(entity.getInterestAmount())
                .totalAmount(entity.getTotalAmount())
                .calculationDate(entity.getCalculationDate())
                .periodStart(entity.getPeriodStart())
                .periodEnd(entity.getPeriodEnd())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
