package com.chidibank.core.application.service;

import com.chidibank.core.application.port.in.UserUseCase;
import com.chidibank.core.application.exception.NotFoundException;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.application.port.out.UserProfilePort;
import com.chidibank.core.domain.User;
import com.chidibank.core.domain.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService implements UserUseCase {

    private final UserPort userPort;
    private final UserProfilePort userProfilePort;

    @Override
    public Map<String, Object> getProfile(String studentId) {
        User user = userPort.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        
        UserProfile profile = userProfilePort.findByUserId(user.getId()).orElse(null);
        
        Map<String, Object> response = new HashMap<>(); // Using Map directly instead of large nested DTO
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("phone", user.getPhone());
        response.put("profilePicture", user.getProfilePicture());
        response.put("isEmailVerified", user.isEmailVerified());
        response.put("isPhoneVerified", user.isPhoneVerified());
        response.put("isKycVerified", user.isKycVerified());
        response.put("kycStatus", user.getKycStatus());
        response.put("twoFactorEnabled", user.isTwoFactorEnabled());
        response.put("isActive", user.isActive());
        response.put("isLocked", user.isLocked());
        response.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        response.put("updatedAt", user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : null);
        response.put("displayCurrency", user.getDisplayCurrency());
        
        if (profile != null) {
            Map<String, Object> profileData = new HashMap<>();
            profileData.put("id", profile.getId());
            profileData.put("userId", profile.getUserId());
            profileData.put("studentId", profile.getStudentId());
            profileData.put("cohort", profile.getCohort());
            profileData.put("school", profile.getSchool());
            profileData.put("dateOfBirth", user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null);
            response.put("userProfile", profileData);
        }
        
        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> updateProfile(String studentId, Map<String, Object> updateRequest) {
        User user = userPort.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
                
        if (updateRequest.containsKey("firstName")) {
            user.setFirstName((String) updateRequest.get("firstName"));
        }
        if (updateRequest.containsKey("lastName")) {
            user.setLastName((String) updateRequest.get("lastName"));
        }
        if (updateRequest.containsKey("phone")) {
            user.setPhone((String) updateRequest.get("phone"));
        }
        if (updateRequest.containsKey("profilePicture")) {
            user.setProfilePicture((String) updateRequest.get("profilePicture"));
        }
        if (updateRequest.containsKey("displayCurrency")) {
            user.setDisplayCurrency((String) updateRequest.get("displayCurrency"));
        }
        
        userPort.saveUser(user);
        
        // Update profile
        UserProfile profile = userProfilePort.findByUserId(user.getId()).orElse(
            UserProfile.builder().userId(user.getId()).build()
        );
        
        if (updateRequest.containsKey("studentId")) {
            profile.setStudentId((String) updateRequest.get("studentId"));
        }
        if (updateRequest.containsKey("cohort")) {
            profile.setCohort((String) updateRequest.get("cohort"));
        }
        if (updateRequest.containsKey("school")) {
            profile.setSchool((String) updateRequest.get("school"));
        }
        if (updateRequest.containsKey("dateOfBirth")) {
            String dob = (String) updateRequest.get("dateOfBirth");
            if (dob != null && !dob.isEmpty()) {
                user.setDateOfBirth(LocalDateTime.parse(dob + "T00:00:00"));
                userPort.saveUser(user);
            }
        }
        
        userProfilePort.saveProfile(profile);
        
        return getProfile(studentId); // Return updated profile
    }

    @Override
    public Map<String, Object> getKycStatus(String studentId) {
        User user = userPort.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
                
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("firstName", user.getFirstName());
        userMap.put("lastName", user.getLastName());
        userMap.put("kycStatus", user.getKycStatus());
        userMap.put("isKycVerified", user.isKycVerified());
        
        Map<String, Object> response = new HashMap<>();
        response.put("user", userMap);
        response.put("documents", new java.util.ArrayList<>());
        
        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> updateDisplayCurrency(String studentId, String displayCurrency) {
        User user = userPort.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
                
        user.setDisplayCurrency(displayCurrency);
        userPort.saveUser(user);
        
        return getProfile(studentId);
    }
}
