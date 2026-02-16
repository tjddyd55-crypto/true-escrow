package com.trustescrow.domain.service;

import com.trustescrow.domain.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    
    Optional<ChatRoom> findByDealId(UUID dealId);
    
    @Query("SELECT cr FROM ChatRoom cr WHERE cr.buyerId = :userId OR cr.sellerId = :userId ORDER BY cr.lastMessageAt DESC NULLS LAST, cr.updatedAt DESC")
    List<ChatRoom> findByParticipantId(@Param("userId") UUID userId);
    
    @Query("SELECT cr FROM ChatRoom cr WHERE (cr.buyerId = :userId OR cr.sellerId = :userId) AND cr.status = :status ORDER BY cr.lastMessageAt DESC NULLS LAST, cr.updatedAt DESC")
    List<ChatRoom> findByParticipantIdAndStatus(@Param("userId") UUID userId, @Param("status") ChatRoom.ChatRoomStatus status);
}
