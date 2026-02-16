package com.trustescrow.application.service;

import com.trustescrow.domain.model.ChatMessage;
import com.trustescrow.domain.model.ChatRoom;
import com.trustescrow.domain.service.ChatMessageRepository;
import com.trustescrow.domain.service.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing chat rooms and messages.
 * Chat is for status display, Escrow is separate domain.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    
    /**
     * Creates or gets a chat room for a deal.
     */
    @Transactional
    public ChatRoom getOrCreateChatRoom(UUID dealId, UUID buyerId, UUID sellerId) {
        return chatRoomRepository.findByDealId(dealId)
            .orElseGet(() -> {
                ChatRoom room = ChatRoom.builder()
                    .dealId(dealId)
                    .buyerId(buyerId)
                    .sellerId(sellerId)
                    .status(ChatRoom.ChatRoomStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
                return chatRoomRepository.save(room);
            });
    }
    
    /**
     * Sends a text message in a chat room.
     */
    @Transactional
    public ChatMessage sendMessage(UUID roomId, UUID senderId, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found: " + roomId));
        
        ChatMessage message = ChatMessage.builder()
            .roomId(roomId)
            .senderId(senderId)
            .content(content)
            .type(ChatMessage.MessageType.TEXT)
            .createdAt(Instant.now())
            .build();
        
        message = chatMessageRepository.save(message);
        
        // Update room's last message time
        room.markLastMessage();
        chatRoomRepository.save(room);
        
        return message;
    }
    
    /**
     * Sends a system message (status update).
     */
    @Transactional
    public ChatMessage sendSystemMessage(UUID roomId, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found: " + roomId));
        
        ChatMessage message = ChatMessage.builder()
            .roomId(roomId)
            .senderId(UUID.fromString("00000000-0000-0000-0000-000000000000")) // System UUID
            .content(content)
            .type(ChatMessage.MessageType.SYSTEM)
            .createdAt(Instant.now())
            .build();
        
        message = chatMessageRepository.save(message);
        
        room.markLastMessage();
        chatRoomRepository.save(room);
        
        return message;
    }
    
    /**
     * Gets all messages for a chat room.
     */
    @Transactional(readOnly = true)
    public List<ChatMessage> getMessages(UUID roomId) {
        return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
    }
    
    /**
     * Gets all chat rooms for a user (card-based UX).
     */
    @Transactional(readOnly = true)
    public List<ChatRoom> getUserChatRooms(UUID userId) {
        return chatRoomRepository.findByParticipantId(userId);
    }
    
    /**
     * Gets a chat room by ID.
     */
    @Transactional(readOnly = true)
    public ChatRoom getChatRoom(UUID roomId) {
        return chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found: " + roomId));
    }
    
    /**
     * Gets unread message count for a room.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID roomId, UUID userId) {
        return chatMessageRepository.countUnreadMessages(roomId, userId);
    }
    
    /**
     * Marks messages as read.
     */
    @Transactional
    public void markMessagesAsRead(UUID roomId, UUID userId) {
        List<ChatMessage> messages = chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
        for (ChatMessage message : messages) {
            if (message.getReadAt() == null && !message.getSenderId().equals(userId)) {
                message.markAsRead();
                chatMessageRepository.save(message);
            }
        }
    }
    
    /**
     * Sends a payment request card message.
     * Content is JSON string with payment request details.
     */
    @Transactional
    public ChatMessage sendPaymentRequestMessage(UUID roomId, UUID senderId, String paymentRequestJson) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found: " + roomId));
        
        ChatMessage message = ChatMessage.builder()
            .roomId(roomId)
            .senderId(senderId)
            .content(paymentRequestJson)
            .type(ChatMessage.MessageType.PAYMENT_REQUEST)
            .createdAt(Instant.now())
            .build();
        
        message = chatMessageRepository.save(message);
        
        room.markLastMessage();
        chatRoomRepository.save(room);
        
        return message;
    }
}
