package com.chidibank.core.application.service;

import com.chidibank.core.application.port.in.CardUseCase;
import com.chidibank.core.application.exception.ForbiddenException;
import com.chidibank.core.application.exception.NotFoundException;
import com.chidibank.core.application.exception.ValidationException;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.out.CardPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.Card;
import com.chidibank.core.domain.User;
import com.chidibank.core.domain.Account;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardService implements CardUseCase {

    private final CardPort cardPort;
    private final UserPort userPort;
    private final AccountPort accountPort;
    private final AuditLogPort auditLogPort;
    private final PasswordEncoder passwordEncoder;

    private String getUserId(String studentId) {
        return userPort.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found")).getId();
    }

    @Override
    @Transactional
    public Map<String, Object> createCard(String studentId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        String accountId = (String) request.get("accountId");
        String cardType = (String) request.getOrDefault("cardType", "VIRTUAL");
        String pin = (String) request.get("pin");

        User user = userPort.findById(userId).get();
        assertKycAllowsCardOperation(user);
        Account account = accountPort.findById(accountId)
                .orElseThrow(() -> new NotFoundException("ACCOUNT_NOT_FOUND", "Account not found"));

        if (!account.getUserId().equals(userId)) {
            throw new ForbiddenException("ACCOUNT_ACCESS_DENIED", "Access denied to this account");
        }
        if (pin == null || !pin.matches("\\d{4}")) {
            throw new ValidationException("INVALID_PIN_FORMAT", "PIN must be exactly 4 digits");
        }

        // Generate Card Detail
        String cardNumber = generateCardNumber();
        String cvv = generateCVV();
        LocalDateTime now = LocalDateTime.now();
        int expiryMonth = now.getMonthValue();
        int expiryYear = now.getYear() + 3;

        Card card = Card.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .accountId(accountId)
                .cardNumber(cardNumber)
                .cvv(cvv)
                .pinHash(passwordEncoder.encode(pin))
                .cardType(cardType)
                .cardBrand("VISA")
                .expiryMonth(expiryMonth)
                .expiryYear(expiryYear)
                .cardholderName((user.getFirstName() + " " + user.getLastName()).toUpperCase())
                .isActive(true)
                .isBlocked(false)
                .dailyLimit(20000000.0) // 20M Default
                .monthlyLimit(200000000.0) // 200M Default
                .atmDailyLimit(5000000.0) // 5M Default
                .createdAt(now)
                .build();

        Card saved = cardPort.saveCard(card);
        
        auditLogPort.createAuditLog(userId, "CREATE_CARD", "cards", saved.getId(), "Type: " + cardType);
        
        return mapToMap(saved);
    }

    @Override
    @Transactional
    public Map<String, Object> updateCardStatus(String studentId, String cardId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        Card card = cardPort.findById(cardId)
                .orElseThrow(() -> new NotFoundException("CARD_NOT_FOUND", "Card not found"));

        if (!card.getUserId().equals(userId)) {
            throw new ForbiddenException("CARD_ACCESS_DENIED", "Access denied");
        }

        if (request.containsKey("isActive")) {
            card.setActive((Boolean) request.get("isActive"));
        }
        if (request.containsKey("isBlocked")) {
            card.setBlocked((Boolean) request.get("isBlocked"));
            if (card.isBlocked()) {
                card.setBlockReason((String) request.getOrDefault("blockReason", "User requested block"));
            }
        }

        cardPort.saveCard(card);
        auditLogPort.createAuditLog(userId, "UPDATE_CARD_STATUS", "cards", cardId, "Active: " + card.isActive() + ", Blocked: " + card.isBlocked());
        
        return mapToMap(card);
    }

    @Override
    @Transactional
    public Map<String, Object> updateCardPin(String studentId, String cardId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        String newPin = (String) request.get("pin");
        
        Card card = cardPort.findById(cardId)
                .orElseThrow(() -> new NotFoundException("CARD_NOT_FOUND", "Card not found"));

        if (!card.getUserId().equals(userId)) {
            throw new ForbiddenException("CARD_ACCESS_DENIED", "Access denied");
        }
        if (newPin == null || !newPin.matches("\\d{4}")) {
            throw new ValidationException("INVALID_PIN_FORMAT", "PIN must be exactly 4 digits");
        }

        card.setPinHash(passwordEncoder.encode(newPin));
        cardPort.saveCard(card);
        
        auditLogPort.createAuditLog(userId, "UPDATE_CARD_PIN", "cards", cardId, "PIN updated");
        return mapToMap(card);
    }

    @Override
    @Transactional
    public Map<String, Object> updateCardLimits(String studentId, String cardId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        Card card = cardPort.findById(cardId)
                .orElseThrow(() -> new NotFoundException("CARD_NOT_FOUND", "Card not found"));

        if (!card.getUserId().equals(userId)) {
            throw new ForbiddenException("CARD_ACCESS_DENIED", "Access denied");
        }

        if (request.containsKey("dailyLimit")) {
            card.setDailyLimit(Double.parseDouble(request.get("dailyLimit").toString()));
        }
        if (request.containsKey("monthlyLimit")) {
            card.setMonthlyLimit(Double.parseDouble(request.get("monthlyLimit").toString()));
        }

        cardPort.saveCard(card);
        return mapToMap(card);
    }

    @Override
    public List<Map<String, Object>> getCards(String studentId) {
        String userId = getUserId(studentId);
        return cardPort.findByUserId(userId).stream()
                .map(this::mapToMap)
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapToMap(Card card) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", card.getId());
        map.put("cardNumber", maskPan(card.getCardNumber()));
        map.put("cardType", card.getCardType());
        map.put("cardBrand", card.getCardBrand());
        map.put("expiryMonth", card.getExpiryMonth());
        map.put("expiryYear", card.getExpiryYear());
        map.put("cardholderName", card.getCardholderName());
        map.put("isActive", card.isActive());
        map.put("isBlocked", card.isBlocked());
        map.put("dailyLimit", card.getDailyLimit());
        map.put("monthlyLimit", card.getMonthlyLimit());
        return map;
    }

    private static void assertKycAllowsCardOperation(User user) {
        boolean ok = user.isKycVerified() || "VERIFIED".equalsIgnoreCase(user.getKycStatus());
        if (!ok) {
            throw new ForbiddenException("KYC_REQUIRED", "Cần hoàn tất xác minh KYC để phát hành/thao tác thẻ");
        }
    }

    private static String maskPan(String pan) {
        if (pan == null || pan.length() < 4) {
            return "****";
        }
        return "**** **** **** " + pan.substring(pan.length() - 4);
    }

    private String generateCardNumber() {
        return "4111" + String.format("%012d", (long) (Math.random() * 1000000000000L));
    }

    private String generateCVV() {
        return String.format("%03d", (int) (Math.random() * 1000));
    }
}
