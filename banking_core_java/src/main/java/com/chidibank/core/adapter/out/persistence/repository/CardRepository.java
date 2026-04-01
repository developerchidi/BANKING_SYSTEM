package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.CardEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CardRepository extends JpaRepository<CardEntity, String> {
    List<CardEntity> findByUserId(String userId);
    List<CardEntity> findByAccountId(String accountId);
}
