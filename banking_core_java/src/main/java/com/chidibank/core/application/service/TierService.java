package com.chidibank.core.application.service;

import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.Account;
import com.chidibank.core.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TierService {

    private final UserPort userPort;
    private final AccountPort accountPort;
    private final AuditLogPort auditLogPort;

    /**
     * Tự động kiểm tra và nâng cấp bậc tài khoản vào 1:00 AM mỗi ngày.
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void evaluateUserTiers() {
        log.info("Starting account tier evaluation");
        int page = 1;
        int limit = 500;
        while (true) {
            List<User> users = userPort.findAll(page, limit);
            if (users.isEmpty()) {
                break;
            }
            users.stream()
                    .filter(User::isActive)
                    .forEach(user -> {
                        try {
                            checkAndUpgradeTier(user.getId());
                        } catch (Exception ex) {
                            log.error("Failed to evaluate tier for user {}", user.getId(), ex);
                        }
                    });
            page++;
        }
    }

    public void checkAndUpgradeTier(String userId) {
        User user = userPort.findById(userId).orElseThrow();
        List<Account> accounts = accountPort.findByUserId(userId);
        
        double totalBalance = accounts.stream()
                .mapToDouble(Account::getBalance)
                .sum();

        String newTier = determineTier(totalBalance);
        
        if (!newTier.equals(user.getAccountTier())) {
            log.info("🚀 Upgrading User {} from {} to {}", userId, user.getAccountTier(), newTier);
            String oldTier = user.getAccountTier();
            user.setAccountTier(newTier);
            userPort.saveUser(user);
            
            // Log the achievement
            auditLogPort.createAuditLog(userId, "TIER_UPGRADE", "users", userId, 
                String.format("Tier upgraded from %s to %s due to balance %s", oldTier, newTier, totalBalance));
            
            // Upgrading limits for all accounts
            updateAccountLimitsForTier(accounts, newTier);
        }
    }

    private String determineTier(double balance) {
        if (balance >= 2000000000.0) return "VIP";
        if (balance >= 500000000.0) return "GOLD";
        if (balance >= 100000000.0) return "STANDARD";
        return "BASIC";
    }

    private void updateAccountLimitsForTier(List<Account> accounts, String tier) {
        double dailyLimit;
        double monthlyLimit;

        switch (tier) {
            case "VIP":
                dailyLimit = 5000000000.0;
                monthlyLimit = 50000000000.0;
                break;
            case "GOLD":
                dailyLimit = 1000000000.0;
                monthlyLimit = 10000000000.0;
                break;
            case "STANDARD":
                dailyLimit = 200000000.0;
                monthlyLimit = 2000000000.0;
                break;
            default:
                dailyLimit = 50000000.0;
                monthlyLimit = 500000000.0;
                break;
        }

        for (Account acc : accounts) {
            acc.setDailyLimit(dailyLimit);
            acc.setMonthlyLimit(monthlyLimit);
            accountPort.saveAccount(acc);
        }
    }
}
