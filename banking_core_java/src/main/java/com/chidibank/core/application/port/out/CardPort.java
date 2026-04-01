package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Card;
import java.util.List;
import java.util.Optional;

public interface CardPort {
    Card saveCard(Card card);
    Optional<Card> findById(String id);
    List<Card> findByAccountId(String accountId);
    List<Card> findByUserId(String userId);
}
