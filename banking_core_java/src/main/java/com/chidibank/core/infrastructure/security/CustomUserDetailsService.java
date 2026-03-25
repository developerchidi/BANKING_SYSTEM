package com.chidibank.core.infrastructure.security;

import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByUserProfileStudentId(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with student ID: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUserProfile().getStudentId(), 
                user.getPassword(), 
                Collections.emptyList()
        );
    }
}
