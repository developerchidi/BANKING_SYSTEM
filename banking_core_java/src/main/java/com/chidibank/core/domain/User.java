package com.chidibank.core.domain;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class User {
    private String id;
    private String email;
    private String phone;
    private String password;
    private String firstName;
    private String lastName;
    private boolean isActive;
    private String accountTier;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
