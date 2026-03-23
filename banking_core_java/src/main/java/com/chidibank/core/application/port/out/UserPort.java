package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.User;
import java.util.Optional;

public interface UserPort {
    User saveUser(User user);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
