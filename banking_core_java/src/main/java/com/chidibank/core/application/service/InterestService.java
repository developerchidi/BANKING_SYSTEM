package com.chidibank.core.application.service;

import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.out.InterestPort;
import com.chidibank.core.domain.Account;
import com.chidibank.core.domain.Interest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterestService {

    private final AccountPort accountPort;
    private final InterestPort interestPort;
    private final AuditLogPort auditLogPort;

    /**
     * Chạy định kỳ vào 00:01 mỗi ngày để chốt lãi suất cho các tài khoản tiết kiệm.
     */
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void processDailyInterest() {
        log.info("🏦 Starting daily interest processing...");
        List<Account> savingsAccounts = accountPort.findActiveSavingsAccounts();
        
        for (Account account : savingsAccounts) {
            try {
                processAccountInterest(account);
            } catch (Exception e) {
                log.error("❌ Failed to process interest for account {}: {}", account.getAccountNumber(), e.getMessage());
            }
        }
        log.info("✅ Daily interest processing completed.");
    }

    private void processAccountInterest(Account account) {
        if (account.getBalance() <= 0 || account.getInterestRate() == null || account.getInterestRate() <= 0) {
            return;
        }

        LocalDateTime lastDate = account.getLastInterestDate();
        if (lastDate == null) {
            lastDate = account.getCreatedAt();
        }

        LocalDateTime now = LocalDateTime.now();
        long days = ChronoUnit.DAYS.between(lastDate, now);

        if (days < 1) {
            return;
        }

        // Formula: Balance * (Rate / 365) * Days
        double dailyRate = account.getInterestRate() / 100 / 365;
        double interestAmount = account.getBalance() * dailyRate * days;
        
        if (interestAmount < 0.01) return; // Skip very small interests

        // Round to 2 decimals
        interestAmount = Math.round(interestAmount * 100.0) / 100.0;

        // 1. Create Interest Record
        Interest interest = Interest.builder()
                .id(UUID.randomUUID().toString())
                .userId(account.getUserId())
                .accountId(account.getId())
                .interestType("SAVINGS_DAILY")
                .interestRate(account.getInterestRate())
                .principalAmount(account.getBalance())
                .interestAmount(interestAmount)
                .totalAmount(account.getBalance() + interestAmount)
                .calculationDate(now)
                .periodStart(lastDate)
                .periodEnd(now)
                .status("COMPLETED")
                .createdAt(now)
                .build();

        interestPort.saveInterest(interest);

        // 2. Update Account
        account.setBalance(account.getBalance() + interestAmount);
        account.setAvailableBalance(account.getAvailableBalance() + interestAmount);
        account.setLastInterestDate(now);
        account.setUpdatedAt(now);
        accountPort.saveAccount(account);

        // 3. Audit Log
        auditLogPort.createAuditLog("SYSTEM", "INTEREST_POSTED", "accounts", account.getId(),
                String.format("Interest of %s added to account %s", interestAmount, account.getAccountNumber()));
        
        log.info("💰 Posted {} VND interest to account {}", interestAmount, account.getAccountNumber());
    }
}
