package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.BeneficiaryEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.BeneficiaryRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.BeneficiaryPort;
import com.chidibank.core.domain.Beneficiary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BeneficiaryPersistenceAdapter implements BeneficiaryPort {

    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;

    @Override
    public Beneficiary saveBeneficiary(Beneficiary beneficiary) {
        UserEntity user = userRepository.findById(beneficiary.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + beneficiary.getUserId()));

        BeneficiaryEntity entity = BeneficiaryEntity.builder()
                .id(beneficiary.getId())
                .user(user)
                // Assuming accountId is mapped if internal, or left null
                .name(beneficiary.getName())
                .nickname(beneficiary.getNickname())
                .bankCode(beneficiary.getBankCode())
                .accountNumber(beneficiary.getAccountNumber())
                .accountName(beneficiary.getAccountName())
                .bankName(beneficiary.getBankName())
                .relationship(beneficiary.getRelationship())
                .dailyLimit(beneficiary.getDailyLimit())
                .monthlyLimit(beneficiary.getMonthlyLimit())
                .isActive(beneficiary.isActive())
                .isVerified(beneficiary.isVerified())
                .build();

        BeneficiaryEntity saved = beneficiaryRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<Beneficiary> findById(String id) {
        return beneficiaryRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public List<Beneficiary> findByUserId(String userId) {
        return beneficiaryRepository.findByUserId(userId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        beneficiaryRepository.deleteById(id);
    }

    private Beneficiary mapToDomain(BeneficiaryEntity entity) {
        return Beneficiary.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .accountId(entity.getAccount() != null ? entity.getAccount().getId() : null)
                .name(entity.getName())
                .nickname(entity.getNickname())
                .bankCode(entity.getBankCode())
                .accountNumber(entity.getAccountNumber())
                .accountName(entity.getAccountName())
                .bankName(entity.getBankName())
                .relationship(entity.getRelationship())
                .dailyLimit(entity.getDailyLimit())
                .monthlyLimit(entity.getMonthlyLimit())
                .isActive(entity.isActive())
                .isVerified(entity.isVerified())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
