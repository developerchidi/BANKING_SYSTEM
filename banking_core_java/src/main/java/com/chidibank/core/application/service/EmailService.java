package com.chidibank.core.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendTransferOtp(String toEmail, String otp) {
        log.info("📧 Sending Transfer OTP to {}", toEmail);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[Chidi Bank] Mã xác thực chuyển tiền (OTP)");
        message.setText("Chào bạn,\n\nMã xác thực (OTP) cho giao dịch chuyển khoản của bạn là: " + otp + 
                        "\n\nMã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nChidi Bank Team.");
        
        try {
            mailSender.send(message);
            log.info("✅ OTP Sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send OTP to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendTransactionConfirmation(String toEmail, String txNumber, double amount, String toAccount) {
        log.info("📧 Sending transaction confirmation to {}", toEmail);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[Chidi Bank] Thông báo biến động số dư");
        message.setText("Chào bạn,\n\nGiao dịch " + txNumber + " đã thực hiện thành công.\n" +
                        "Số tiền: -" + amount + " VND\n" +
                        "Đến tài khoản: " + toAccount + "\n" +
                        "\nCảm ơn bạn đã sử dụng dịch vụ của Chidi Bank.");
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.error("❌ Failed to send confirmation to {}: {}", toEmail, e.getMessage());
        }
    }
}
