package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.TermsAcceptanceEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.TermsAcceptanceRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.TermsAcceptancePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class TermsAcceptancePersistenceAdapter implements TermsAcceptancePort {

    private final TermsAcceptanceRepository termsRepository;
    private final UserRepository userRepository;

    @Override
    public void createAcceptance(String userId, String termsVersion, String termsType, String ipAddress, String userAgent) {
        UserEntity user = userRepository.findById(userId).orElseThrow();
        
        TermsAcceptanceEntity acceptance = TermsAcceptanceEntity.builder()
                .user(user)
                .termsVersion(termsVersion)
                .termsType(termsType)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .acceptanceMethod("MOBILE")
                .acceptedAt(LocalDateTime.now())
                .build();
        
        termsRepository.save(acceptance);
    }
}
