package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Beneficiary;
import java.util.List;
import java.util.Optional;

public interface BeneficiaryPort {
    Beneficiary saveBeneficiary(Beneficiary beneficiary);
    Optional<Beneficiary> findById(String id);
    List<Beneficiary> findByUserId(String userId);
    void deleteById(String id);
}
