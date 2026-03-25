package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.UserProfile;
import java.util.Optional;

public interface UserProfilePort {
    void createProfile(String userId, String studentId, String cohort, String school, 
                       String currentAddress, String permanentAddress, 
                       String emergencyContact, String emergencyPhone);
                       
    Optional<UserProfile> findByUserId(String userId);
    
    UserProfile saveProfile(UserProfile profile);
}
