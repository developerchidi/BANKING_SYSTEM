package com.chidibank.core.infrastructure.security;

import com.chidibank.core.adapter.out.persistence.entity.RoleEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserProfileEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserRoleEntity;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService service;

    @Test
    void loadUserByUsername_shouldMapRolesToAuthorities() {
        RoleEntity adminRole = RoleEntity.builder().name("admin").displayName("Admin").build();
        UserEntity user = UserEntity.builder()
                .id("u1")
                .password("encoded")
                .userProfile(UserProfileEntity.builder().studentId("SE123").build())
                .build();
        UserRoleEntity userRole = UserRoleEntity.builder().user(user).role(adminRole).isActive(true).build();
        user.setUserRoles(List.of(userRole));
        when(userRepository.findByUserProfileStudentId("SE123")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("SE123");

        assertThat(details.getAuthorities()).extracting("authority").contains("ROLE_ADMIN");
    }
}
