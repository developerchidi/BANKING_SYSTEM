package com.chidibank.core.infrastructure.security;

import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserRoleEntity;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByUserProfileStudentId(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with student ID: " + username));

        List<GrantedAuthority> authorities = user.getUserRoles() == null
                ? List.of(new SimpleGrantedAuthority("ROLE_USER"))
                : user.getUserRoles().stream()
                .filter(UserRoleEntity::isActive)
                .map(userRole -> "ROLE_" + userRole.getRole().getName().toUpperCase())
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        if (authorities.isEmpty()) {
            authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUserProfile().getStudentId(), 
                user.getPassword(), 
                authorities
        );
    }
}
