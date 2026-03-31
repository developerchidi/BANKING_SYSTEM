package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Interest;
import java.util.List;

public interface InterestPort {
    Interest saveInterest(Interest interest);
    List<Interest> findByAccountId(String accountId);
}
