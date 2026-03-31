package com.chidibank.core.application.port.in;

import java.util.List;
import java.util.Map;

public interface CardUseCase {
    Map<String, Object> createCard(String studentId, Map<String, Object> request);
    Map<String, Object> updateCardStatus(String studentId, String cardId, Map<String, Object> request);
    Map<String, Object> updateCardPin(String studentId, String cardId, Map<String, Object> request);
    Map<String, Object> updateCardLimits(String studentId, String cardId, Map<String, Object> request);
    List<Map<String, Object>> getCards(String studentId);
}
