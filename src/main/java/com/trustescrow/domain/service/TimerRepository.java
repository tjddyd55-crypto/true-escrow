package com.trustescrow.domain.service;

import com.trustescrow.domain.model.Timer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TimerRepository extends JpaRepository<Timer, UUID> {
    
    @Query("SELECT t FROM Timer t WHERE t.timerType = :type AND t.active = true")
    List<Timer> findActiveByType(@Param("type") String type);
    
    Optional<Timer> findByDealIdAndTypeAndActive(UUID dealId, String type, boolean active);
}
