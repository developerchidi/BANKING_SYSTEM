package com.chidibank.core.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @NotBlank
    private String studentId;
    @NotBlank
    private String password;
}
