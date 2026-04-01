package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.TermsAcceptanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TermsAcceptanceRepository extends JpaRepository<TermsAcceptanceEntity, String> {
}
