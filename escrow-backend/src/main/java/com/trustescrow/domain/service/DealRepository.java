package com.trustescrow.domain.service;

import com.trustescrow.domain.model.Deal;
import com.trustescrow.domain.model.DealState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DealRepository extends JpaRepository<Deal, UUID> {
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Deal d WHERE d.id = :id")
    Optional<Deal> findByIdWithLock(@Param("id") UUID id);
    
    List<Deal> findByState(DealState state);
}
