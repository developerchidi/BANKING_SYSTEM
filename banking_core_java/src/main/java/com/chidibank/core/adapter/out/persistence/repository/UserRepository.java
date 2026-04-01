package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByUserProfileStudentId(String studentId);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByPhone(String phone);
    long countByIsActiveTrue();
    long countByKycStatus(String kycStatus);
    @Query("select count(u) from UserEntity u")
    long countAllUsers();
}
