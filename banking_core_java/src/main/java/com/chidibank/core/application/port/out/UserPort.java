package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.User;
import java.util.Optional;

public interface UserPort {
    User saveUser(User user);

    Optional<User> findById(String id);

    Optional<User> findByStudentId(String studentId);

    Optional<User> findByEmail(String email);

    boolean existsByStudentId(String studentId);

    boolean existsByEmail(String email);
    
    boolean existsByPhone(String phone);

    void incrementFailedAttempts(String studentId);

    void resetFailedAttempts(String studentId);

    void lockAccount(String studentId, int minutes);
}
