package com.chidibank.core.application.port.in;

import com.chidibank.core.adapter.in.web.dto.AuthRequest;
import com.chidibank.core.adapter.in.web.dto.AuthResponse;
import com.chidibank.core.adapter.in.web.dto.RegisterRequest;
import com.chidibank.core.domain.User;

public interface AuthUseCase {
    AuthResponse login(AuthRequest request);
    User register(RegisterRequest request);
}
