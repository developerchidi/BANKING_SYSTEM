package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserProfileEntity;
import com.chidibank.core.adapter.out.persistence.repository.UserProfileRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.UserProfilePort;
import com.chidibank.core.domain.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserProfilePersistenceAdapter implements UserProfilePort {

    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Override
    public void createProfile(String userId, String studentId, String cohort, String school, 
                               String currentAddress, String permanentAddress, 
                               String emergencyContact, String emergencyPhone) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        UserProfileEntity profile = UserProfileEntity.builder()
                .user(user)
                .studentId(studentId)
                .cohort(cohort)
                .school(school)
                .currentAddress(currentAddress)
                .permanentAddress(permanentAddress)
                .emergencyContact(emergencyContact)
                .emergencyPhone(emergencyPhone)
                .build();
        
        profileRepository.save(profile);
    }

    @Override
    public Optional<UserProfile> findByUserId(String userId) {
        return profileRepository.findByUserId(userId).map(this::mapToDomain);
    }

    @Override
    public UserProfile saveProfile(UserProfile profile) {
        UserEntity user = userRepository.findById(profile.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + profile.getUserId()));

        UserProfileEntity entity = UserProfileEntity.builder()
                .id(profile.getId())
                .user(user)
                .studentId(profile.getStudentId())
                .cohort(profile.getCohort())
                .school(profile.getSchool())
                .currentAddress(profile.getCurrentAddress())
                .permanentAddress(profile.getPermanentAddress())
                .emergencyContact(profile.getEmergencyContact())
                .emergencyPhone(profile.getEmergencyPhone())
                .idNumber(profile.getIdNumber())
                .idType(profile.getIdType())
                .idIssueDate(profile.getIdIssueDate())
                .idIssuePlace(profile.getIdIssuePlace())
                .idExpiryDate(profile.getIdExpiryDate())
                .maritalStatus(profile.getMaritalStatus())
                .dependents(profile.getDependents())
                .educationLevel(profile.getEducationLevel())
                .build();
        
        UserProfileEntity saved = profileRepository.save(entity);
        return mapToDomain(saved);
    }

    private UserProfile mapToDomain(UserProfileEntity entity) {
        return UserProfile.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .idNumber(entity.getIdNumber())
                .idType(entity.getIdType())
                .idIssueDate(entity.getIdIssueDate())
                .idIssuePlace(entity.getIdIssuePlace())
                .idExpiryDate(entity.getIdExpiryDate())
                .studentId(entity.getStudentId())
                .cohort(entity.getCohort())
                .school(entity.getSchool())
                .currentAddress(entity.getCurrentAddress())
                .permanentAddress(entity.getPermanentAddress())
                .emergencyContact(entity.getEmergencyContact())
                .emergencyPhone(entity.getEmergencyPhone())
                .maritalStatus(entity.getMaritalStatus())
                .dependents(entity.getDependents())
                .educationLevel(entity.getEducationLevel())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
