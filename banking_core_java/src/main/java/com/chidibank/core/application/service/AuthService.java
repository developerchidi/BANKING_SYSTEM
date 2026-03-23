package com.chidibank.core.application.service;

import com.chidibank.core.adapter.in.web.dto.AuthRequest;
import com.chidibank.core.adapter.in.web.dto.AuthResponse;
import com.chidibank.core.adapter.in.web.dto.RegisterRequest;
import com.chidibank.core.application.port.in.AuthUseCase;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.User;
import com.chidibank.core.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthUseCase {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserPort userPort;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userPort.findByEmail(request.getEmail()).orElseThrow();

        return AuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .role("CUSTOMER")
                .build();
    }

    @Override
    public User register(RegisterRequest request) {
        if (userPort.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        User newUser = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .isActive(true)
                .accountTier("BASIC")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return userPort.saveUser(newUser);
    }
}
