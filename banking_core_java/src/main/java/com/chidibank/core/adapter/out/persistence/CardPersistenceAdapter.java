package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.AccountEntity;
import com.chidibank.core.adapter.out.persistence.entity.CardEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.AccountRepository;
import com.chidibank.core.adapter.out.persistence.repository.CardRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.CardPort;
import com.chidibank.core.domain.Card;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CardPersistenceAdapter implements CardPort {

    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    @Override
    public Card saveCard(Card card) {
        UserEntity user = userRepository.findById(card.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        AccountEntity account = accountRepository.findById(card.getAccountId())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        CardEntity entity = CardEntity.builder()
                .id(card.getId())
                .user(user)
                .account(account)
                .cardNumber(card.getCardNumber())
                .cardType(card.getCardType())
                .cardBrand(card.getCardBrand())
                .expiryMonth(card.getExpiryMonth())
                .expiryYear(card.getExpiryYear())
                .cvv(card.getCvv())
                .cardholderName(card.getCardholderName())
                .isActive(card.isActive())
                .isBlocked(card.isBlocked())
                .blockReason(card.getBlockReason())
                .dailyLimit(card.getDailyLimit())
                .monthlyLimit(card.getMonthlyLimit())
                .atmDailyLimit(card.getAtmDailyLimit())
                .pinHash(card.getPinHash())
                .pinAttempts(card.getPinAttempts())
                .pinLockedUntil(card.getPinLockedUntil())
                .build();

        CardEntity saved = cardRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<Card> findById(String id) {
        return cardRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public List<Card> findByAccountId(String accountId) {
        return cardRepository.findByAccountId(accountId).stream().map(this::mapToDomain).collect(Collectors.toList());
    }

    @Override
    public List<Card> findByUserId(String userId) {
        return cardRepository.findByUserId(userId).stream().map(this::mapToDomain).collect(Collectors.toList());
    }

    private Card mapToDomain(CardEntity entity) {
        return Card.builder()
                .id(entity.getId())
                .cardNumber(entity.getCardNumber())
                .cardType(entity.getCardType())
                .cardBrand(entity.getCardBrand())
                .expiryMonth(entity.getExpiryMonth())
                .expiryYear(entity.getExpiryYear())
                .cvv(entity.getCvv())
                .cardholderName(entity.getCardholderName())
                .isActive(entity.isActive())
                .isBlocked(entity.isBlocked())
                .blockReason(entity.getBlockReason())
                .dailyLimit(entity.getDailyLimit())
                .monthlyLimit(entity.getMonthlyLimit())
                .atmDailyLimit(entity.getAtmDailyLimit())
                .pinHash(entity.getPinHash())
                .pinAttempts(entity.getPinAttempts())
                .pinLockedUntil(entity.getPinLockedUntil())
                .userId(entity.getUser().getId())
                .accountId(entity.getAccount().getId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
