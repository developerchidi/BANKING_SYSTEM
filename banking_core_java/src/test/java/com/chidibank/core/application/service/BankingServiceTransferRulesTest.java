package com.chidibank.core.application.service;

import com.chidibank.core.application.exception.ForbiddenException;
import com.chidibank.core.application.exception.ValidationException;
import com.chidibank.core.application.port.in.NotificationUseCase;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.out.BeneficiaryPort;
import com.chidibank.core.application.port.out.CardPort;
import com.chidibank.core.application.port.out.OtpPort;
import com.chidibank.core.application.port.out.TransactionPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.Account;
import com.chidibank.core.domain.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankingServiceTransferRulesTest {

    @Mock
    private AccountPort accountPort;
    @Mock
    private UserPort userPort;
    @Mock
    private TransactionPort transactionPort;
    @Mock
    private CardPort cardPort;
    @Mock
    private BeneficiaryPort beneficiaryPort;
    @Mock
    private OtpPort otpPort;
    @Mock
    private AuditLogPort auditLogPort;
    @Mock
    private EmailService emailService;
    @Mock
    private NotificationUseCase notificationUseCase;
    @Mock
    private TierService tierService;

    @InjectMocks
    private BankingService bankingService;

    @Test
    void transfer_shouldReject_whenKycNotVerified() {
        User u = User.builder()
                .id("u1")
                .studentId("s1")
                .isKycVerified(false)
                .kycStatus("PENDING")
                .build();
        when(userPort.findByStudentId("s1")).thenReturn(Optional.of(u));
        when(userPort.findById("u1")).thenReturn(Optional.of(u));

        Map<String, Object> req = new HashMap<>();
        req.put("fromAccountId", "acc1");
        req.put("toAccountNumber", "999");
        req.put("amount", 10.0);

        assertThatThrownBy(() -> bankingService.transfer("s1", req))
                .isInstanceOf(ForbiddenException.class)
                .hasFieldOrPropertyWithValue("code", "KYC_REQUIRED");
    }

    @Test
    void transfer_shouldReject_whenDailyLimitExceeded() {
        User u = User.builder()
                .id("u1")
                .studentId("s1")
                .isKycVerified(true)
                .kycStatus("VERIFIED")
                .build();
        when(userPort.findByStudentId("s1")).thenReturn(Optional.of(u));
        when(userPort.findById("u1")).thenReturn(Optional.of(u));
        when(transactionPort.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());

        Account from = Account.builder()
                .id("acc1")
                .userId("u1")
                .accountNumber("111")
                .currency("VND")
                .balance(1_000_000)
                .availableBalance(1_000_000)
                .isActive(true)
                .isFrozen(false)
                .dailyLimit(1000.0)
                .monthlyLimit(1_000_000_000.0)
                .build();
        when(accountPort.findByIdForUpdate("acc1")).thenReturn(Optional.of(from));
        when(transactionPort.sumCompletedOutgoingFromAccountSince(anyString(), any())).thenReturn(950.0);

        Map<String, Object> req = new HashMap<>();
        req.put("fromAccountId", "acc1");
        req.put("toAccountNumber", "222");
        req.put("amount", 100.0);

        assertThatThrownBy(() -> bankingService.transfer("s1", req))
                .isInstanceOf(ValidationException.class)
                .hasFieldOrPropertyWithValue("code", "DAILY_LIMIT_EXCEEDED");
    }
}
