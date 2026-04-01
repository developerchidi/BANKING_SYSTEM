package com.chidibank.core.adapter.in.web;

import com.chidibank.core.application.port.in.CardUseCase;
import com.chidibank.core.adapter.in.web.dto.CardDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/cards", "/api/v1/banking/cards", "/api/v1/cards"})
@RequiredArgsConstructor
public class CardController {

    private final CardUseCase cardUseCase;

    @GetMapping
    public ResponseEntity<?> getCards(Authentication authentication) {
        String studentId = authentication.getName();
        List<Map<String, Object>> cards = cardUseCase.getCards(studentId);
        return ResponseEntity.ok(Map.of("success", true, "data", cards));
    }

    @PostMapping
    public ResponseEntity<?> createCard(
            Authentication authentication,
            @Valid @RequestBody CardDtos.CreateCardRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> card = cardUseCase.createCard(studentId, Map.of(
                "accountId", request.getAccountId(),
                "cardType", request.getCardType(),
                "pin", request.getPin()
        ));
        return ResponseEntity.ok(Map.of("success", true, "data", card, "message", "Card created successfully"));
    }

    @PutMapping("/{cardId}/status")
    public ResponseEntity<?> updateCardStatus(
            Authentication authentication,
            @PathVariable String cardId,
            @RequestBody CardDtos.UpdateCardStatusRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("isActive", request.getIsActive());
        payload.put("isBlocked", request.getIsBlocked());
        payload.put("blockReason", request.getBlockReason());
        Map<String, Object> card = cardUseCase.updateCardStatus(studentId, cardId, payload);
        return ResponseEntity.ok(Map.of("success", true, "data", card));
    }

    @PutMapping("/{cardId}/pin")
    public ResponseEntity<?> updateCardPin(
            Authentication authentication,
            @PathVariable String cardId,
            @Valid @RequestBody CardDtos.UpdateCardPinRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> card = cardUseCase.updateCardPin(studentId, cardId, Map.of("pin", request.getPin()));
        return ResponseEntity.ok(Map.of("success", true, "data", card));
    }

    @PutMapping("/{cardId}/limits")
    public ResponseEntity<?> updateCardLimits(
            Authentication authentication,
            @PathVariable String cardId,
            @Valid @RequestBody CardDtos.UpdateCardLimitsRequest request) {
        String studentId = authentication.getName();
        Map<String, Object> card = cardUseCase.updateCardLimits(studentId, cardId, Map.of(
                "dailyLimit", request.getDailyLimit(),
                "monthlyLimit", request.getMonthlyLimit()
        ));
        return ResponseEntity.ok(Map.of("success", true, "data", card));
    }
}
