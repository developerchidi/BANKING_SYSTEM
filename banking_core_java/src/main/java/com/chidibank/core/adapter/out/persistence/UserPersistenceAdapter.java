package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserPort {

    private final UserRepository userRepository;

    @Override
    public User saveUser(User domainUser) {
        UserEntity entity = UserEntity.builder()
                .email(domainUser.getEmail())
                .phone(domainUser.getPhone())
                .password(domainUser.getPassword())
                .firstName(domainUser.getFirstName())
                .lastName(domainUser.getLastName())
                .middleName(domainUser.getMiddleName())
                .dateOfBirth(domainUser.getDateOfBirth())
                .gender(domainUser.getGender())
                .nationality(domainUser.getNationality())
                .displayCurrency(domainUser.getDisplayCurrency())
                .isEmailVerified(domainUser.isEmailVerified())
                .isPhoneVerified(domainUser.isPhoneVerified())
                .isKycVerified(domainUser.isKycVerified())
                .kycStatus(domainUser.getKycStatus())
                .kycDocuments(domainUser.getKycDocuments())
                .kycApprovedAt(domainUser.getKycApprovedAt())
                .kycApprovedBy(domainUser.getKycApprovedBy())
                .kycRejectedAt(domainUser.getKycRejectedAt())
                .kycRejectedBy(domainUser.getKycRejectedBy())
                .kycReviewNotes(domainUser.getKycReviewNotes())
                .twoFactorEnabled(domainUser.isTwoFactorEnabled())
                .twoFactorSecret(domainUser.getTwoFactorSecret())
                .twoFactorMethod(domainUser.getTwoFactorMethod())
                .lastLoginAt(domainUser.getLastLoginAt())
                .lastLoginIp(domainUser.getLastLoginIp())
                .isActive(domainUser.isActive())
                .isLocked(domainUser.isLocked())
                .lockedUntil(domainUser.getLockedUntil())
                .failedLoginAttempts(domainUser.getFailedLoginAttempts())
                .profilePicture(domainUser.getProfilePicture())
                .address(domainUser.getAddress())
                .occupation(domainUser.getOccupation())
                .monthlyIncome(domainUser.getMonthlyIncome())
                .accountTier(domainUser.getAccountTier())
                .build();

        if (domainUser.getId() != null) {
            entity.setId(domainUser.getId());
        }

        UserEntity saved = userRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<User> findById(String id) {
        return userRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public Optional<User> findByStudentId(String studentId) {
        return userRepository.findByUserProfileStudentId(studentId).map(this::mapToDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email).map(this::mapToDomain);
    }

    @Override
    public boolean existsByStudentId(String studentId) {
        return userRepository.findByUserProfileStudentId(studentId).isPresent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByPhone(String phone) {
        return userRepository.findByPhone(phone).isPresent();
    }

    @Override
    public void incrementFailedAttempts(String studentId) {
        userRepository.findByUserProfileStudentId(studentId).ifPresent(user -> {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 5) {
                user.setLocked(true);
                user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);
        });
    }

    @Override
    public void resetFailedAttempts(String studentId) {
        userRepository.findByUserProfileStudentId(studentId).ifPresent(user -> {
            user.setFailedLoginAttempts(0);
            user.setLocked(false);
            user.setLockedUntil(null);
            userRepository.save(user);
        });
    }

    @Override
    public void lockAccount(String studentId, int minutes) {
        userRepository.findByUserProfileStudentId(studentId).ifPresent(user -> {
            user.setLocked(true);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(minutes));
            userRepository.save(user);
        });
    }

    private User mapToDomain(UserEntity entity) {
        String studentId = entity.getUserProfile() != null ? entity.getUserProfile().getStudentId() : null;

        return User.builder()
                .id(entity.getId())
                .studentId(studentId)
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .password(entity.getPassword())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .middleName(entity.getMiddleName())
                .dateOfBirth(entity.getDateOfBirth())
                .gender(entity.getGender())
                .nationality(entity.getNationality())
                .displayCurrency(entity.getDisplayCurrency())
                .isEmailVerified(entity.isEmailVerified())
                .isPhoneVerified(entity.isPhoneVerified())
                .isKycVerified(entity.isKycVerified())
                .kycStatus(entity.getKycStatus())
                .kycDocuments(entity.getKycDocuments())
                .kycApprovedAt(entity.getKycApprovedAt())
                .kycApprovedBy(entity.getKycApprovedBy())
                .kycRejectedAt(entity.getKycRejectedAt())
                .kycRejectedBy(entity.getKycRejectedBy())
                .kycReviewNotes(entity.getKycReviewNotes())
                .twoFactorEnabled(entity.isTwoFactorEnabled())
                .twoFactorSecret(entity.getTwoFactorSecret())
                .twoFactorMethod(entity.getTwoFactorMethod())
                .lastLoginAt(entity.getLastLoginAt())
                .lastLoginIp(entity.getLastLoginIp())
                .isActive(entity.isActive())
                .isLocked(entity.isLocked())
                .lockedUntil(entity.getLockedUntil())
                .failedLoginAttempts(entity.getFailedLoginAttempts())
                .profilePicture(entity.getProfilePicture())
                .address(entity.getAddress())
                .occupation(entity.getOccupation())
                .monthlyIncome(entity.getMonthlyIncome())
                .accountTier(entity.getAccountTier())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
