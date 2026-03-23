package com.chidibank.core.adapter.in.web.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private String userId;
    private String email;
    private String role;
}
