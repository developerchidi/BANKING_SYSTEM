package com.chidibank.core.application.service;

import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.out.TransactionPort;
import com.chidibank.core.application.port.out.UserPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {
    @Mock
    private UserPort userPort;
    @Mock
    private TransactionPort transactionPort;
    @Mock
    private AccountPort accountPort;
    @Mock
    private AuditLogPort auditLogPort;

    @InjectMocks
    private AdminService adminService;

    @Test
    void getSystemStats_shouldReturnAggregatedValues() {
        when(userPort.countAll()).thenReturn(100L);
        when(userPort.countActiveUsers()).thenReturn(80L);
        when(userPort.countPendingKyc()).thenReturn(7L);
        when(transactionPort.countAll()).thenReturn(200L);
        when(transactionPort.totalVolumeCompleted()).thenReturn(99999.0);

        Map<String, Object> stats = adminService.getSystemStats();

        assertThat(stats.get("totalUsers")).isEqualTo(100L);
        assertThat(stats.get("activeUsers")).isEqualTo(80L);
        assertThat(stats.get("pendingKyc")).isEqualTo(7L);
        assertThat(stats.get("totalTransactions")).isEqualTo(200L);
        assertThat(stats.get("totalVolume")).isEqualTo(99999.0);
        assertThat(stats).containsKey("updatedAt");
    }
}
