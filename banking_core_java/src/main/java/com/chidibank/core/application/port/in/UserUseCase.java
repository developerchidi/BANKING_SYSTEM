package com.chidibank.core.application.port.in;

import com.chidibank.core.adapter.in.web.dto.ApiResponse;
import java.util.Map;

public interface UserUseCase {
    Map<String, Object> getProfile(String userId);
    
    Map<String, Object> updateProfile(String userId, Map<String, Object> updateRequest);
    
    Map<String, Object> getKycStatus(String userId);
    
    Map<String, Object> updateDisplayCurrency(String userId, String displayCurrency);
}
