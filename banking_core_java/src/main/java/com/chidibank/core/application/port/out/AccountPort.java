package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Account;
import java.util.List;
import java.util.Optional;

public interface AccountPort {
    void createDefaultAccount(String userId, String firstName, String lastName);
    Account saveAccount(Account account);
    Optional<Account> findById(String id);
    Optional<Account> findByAccountNumber(String accountNumber);
    List<Account> findByUserId(String userId);
}
