package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Account;
import java.util.List;
import java.util.Optional;

public interface AccountPort {
    void createDefaultAccount(String userId, String firstName, String lastName);
    Account saveAccount(Account account);
    Optional<Account> findById(String id);
    Optional<Account> findByIdForUpdate(String id);
    Optional<Account> findByAccountNumber(String accountNumber);
    Optional<Account> findByAccountNumberForUpdate(String accountNumber);
    List<Account> findByUserId(String userId);
    List<Account> findActiveSavingsAccounts();
}
