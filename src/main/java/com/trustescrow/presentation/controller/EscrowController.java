package com.trustescrow.presentation.controller;

import com.trustescrow.application.dto.*;
import com.trustescrow.application.service.*;
import com.trustescrow.domain.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller for Escrow + Chat + Payment MVP.
 * POST /api/escrow/create etc.
 */
@RestController
@RequestMapping("/api/escrow")
@RequiredArgsConstructor
public class EscrowController {
    
    private final DealApplicationService dealService;
    private final ChatService chatService;
    private final PaymentService paymentService;
    private final MilestoneService milestoneService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Creates a new escrow deal with chat room and payment info.
     * POST /api/escrow/create
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<DealResponse>> createEscrowDeal(
        @Valid @RequestBody CreateEscrowDealRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId
    ) {
        UUID actorId = userId != null ? userId : UUID.randomUUID();
        
        // Create deal
        CreateDealRequest createDealRequest = CreateDealRequest.builder()
            .buyerId(request.getBuyerId())
            .sellerId(request.getSellerId())
            .itemRef(request.getItemRef())
            .category(request.getCategory())
            .totalAmount(request.getTotalAmount())
            .currency(request.getCurrency())
            .build();
        
        Deal deal = dealService.createDeal(createDealRequest, actorId);
        
        // Create chat room
        chatService.getOrCreateChatRoom(deal.getId(), request.getBuyerId(), request.getSellerId());
        
        // Create payment info
        paymentService.createOrUpdatePaymentInfo(
            deal.getId(),
            request.getBuyerId(),
            request.getSellerId(),
            null,
            null
        );
        
        // Create milestones (max 3)
        if (request.getMilestones() != null) {
            for (MilestoneRequest milestoneReq : request.getMilestones()) {
                milestoneService.createMilestone(
                    deal.getId(),
                    milestoneReq.getTitle(),
                    milestoneReq.getDescription(),
                    milestoneReq.getAmount(),
                    milestoneReq.getOrderIndex()
                );
            }
        }
        
        DealResponse response = DealResponse.from(deal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Gets chat rooms for a user (card-based UX).
     * GET /api/escrow/chat/rooms
     */
    @GetMapping("/chat/rooms")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getChatRooms(
        @RequestHeader(value = "X-User-Id", required = false) UUID userId
    ) {
        if (userId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        List<ChatRoom> rooms = chatService.getUserChatRooms(userId);
        List<ChatRoomResponse> responses = rooms.stream()
            .map(room -> {
                ChatRoomResponse response = new ChatRoomResponse();
                response.setId(room.getId());
                response.setDealId(room.getDealId());
                response.setBuyerId(room.getBuyerId());
                response.setSellerId(room.getSellerId());
                response.setStatus(room.getStatus().name());
                response.setCreatedAt(room.getCreatedAt());
                response.setLastMessageAt(room.getLastMessageAt());
                response.setUnreadCount(chatService.getUnreadCount(room.getId(), userId));
                return response;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
    
    /**
     * Gets messages for a chat room.
     * GET /api/escrow/chat/rooms/{roomId}/messages
     */
    @GetMapping("/chat/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
        @PathVariable UUID roomId,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId
    ) {
        List<ChatMessage> messages = chatService.getMessages(roomId);
        List<ChatMessageResponse> responses = messages.stream()
            .map(msg -> {
                ChatMessageResponse response = new ChatMessageResponse();
                response.setId(msg.getId());
                response.setRoomId(msg.getRoomId());
                response.setSenderId(msg.getSenderId());
                response.setContent(msg.getContent());
                response.setType(msg.getType().name());
                response.setCreatedAt(msg.getCreatedAt());
                response.setReadAt(msg.getReadAt());
                return response;
            })
            .collect(Collectors.toList());
        
        // Mark messages as read
        if (userId != null) {
            chatService.markMessagesAsRead(roomId, userId);
        }
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
    
    /**
     * Sends a message in a chat room.
     * POST /api/escrow/chat/rooms/{roomId}/messages
     */
    @PostMapping("/chat/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
        @PathVariable UUID roomId,
        @Valid @RequestBody SendMessageRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId
    ) {
        UUID senderId = userId != null ? userId : request.getSenderId();
        if (senderId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Sender ID is required"));
        }
        
        ChatMessage message = chatService.sendMessage(roomId, senderId, request.getContent());
        
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setRoomId(message.getRoomId());
        response.setSenderId(message.getSenderId());
        response.setContent(message.getContent());
        response.setType(message.getType().name());
        response.setCreatedAt(message.getCreatedAt());
        response.setReadAt(message.getReadAt());
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Gets payment info for a deal.
     * GET /api/escrow/payment/{dealId}
     */
    @GetMapping("/payment/{dealId}")
    public ResponseEntity<ApiResponse<PaymentInfoResponse>> getPaymentInfo(
        @PathVariable UUID dealId
    ) {
        return paymentService.getPaymentInfo(dealId)
            .map(paymentInfo -> {
                PaymentInfoResponse response = new PaymentInfoResponse();
                response.setId(paymentInfo.getId());
                response.setDealId(paymentInfo.getDealId());
                response.setBuyerId(paymentInfo.getBuyerId());
                response.setSellerId(paymentInfo.getSellerId());
                response.setTotalAmount(paymentInfo.getTotalAmount());
                response.setCurrency(paymentInfo.getCurrency());
                response.setStatus(paymentInfo.getStatus().name());
                response.setPaymentMethod(paymentInfo.getPaymentMethod());
                response.setPaymentProvider(paymentInfo.getPaymentProvider());
                response.setPaidAt(paymentInfo.getPaidAt());
                return ResponseEntity.ok(ApiResponse.success(response));
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Updates payment info (dedicated payment setup page).
     * PUT /api/escrow/payment/{dealId}
     */
    @PutMapping("/payment/{dealId}")
    public ResponseEntity<ApiResponse<PaymentInfoResponse>> updatePaymentInfo(
        @PathVariable UUID dealId,
        @Valid @RequestBody UpdatePaymentInfoRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId
    ) {
        UUID buyerId = userId != null ? userId : request.getBuyerId();
        UUID sellerId = request.getSellerId();
        
        PaymentInfo paymentInfo = paymentService.createOrUpdatePaymentInfo(
            dealId,
            buyerId,
            sellerId,
            request.getPaymentMethod(),
            request.getPaymentProvider()
        );
        
        PaymentInfoResponse response = new PaymentInfoResponse();
        response.setId(paymentInfo.getId());
        response.setDealId(paymentInfo.getDealId());
        response.setBuyerId(paymentInfo.getBuyerId());
        response.setSellerId(paymentInfo.getSellerId());
        response.setTotalAmount(paymentInfo.getTotalAmount());
        response.setCurrency(paymentInfo.getCurrency());
        response.setStatus(paymentInfo.getStatus().name());
        response.setPaymentMethod(paymentInfo.getPaymentMethod());
        response.setPaymentProvider(paymentInfo.getPaymentProvider());
        response.setPaidAt(paymentInfo.getPaidAt());
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Gets milestones for a deal.
     * GET /api/escrow/milestones/{dealId}
     */
    @GetMapping("/milestones/{dealId}")
    public ResponseEntity<ApiResponse<List<MilestoneResponse>>> getMilestones(
        @PathVariable UUID dealId
    ) {
        List<DealMilestone> milestones = milestoneService.getMilestones(dealId);
        List<MilestoneResponse> responses = milestones.stream()
            .map(m -> {
                MilestoneResponse response = new MilestoneResponse();
                response.setId(m.getId());
                response.setDealId(m.getDealId());
                response.setOrderIndex(m.getOrderIndex());
                response.setTitle(m.getTitle());
                response.setDescription(m.getDescription());
                response.setAmount(m.getAmount());
                response.setStatus(m.getStatus().name());
                response.setCreatedAt(m.getCreatedAt());
                response.setCompletedAt(m.getCompletedAt());
                return response;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
    
    /**
     * Creates a payment request in a chat room.
     * POST /api/escrow/chat/rooms/{roomId}/payment-request
     */
    @PostMapping("/chat/rooms/{roomId}/payment-request")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> createPaymentRequest(
        @PathVariable UUID roomId,
        @Valid @RequestBody CreatePaymentRequestRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId
    ) {
        if (userId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        // Get chat room
        ChatRoom room = chatService.getChatRoom(roomId);
        
        // Create payment request JSON
        String paymentRequestJson;
        try {
            paymentRequestJson = objectMapper.writeValueAsString(request);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to serialize payment request"));
        }
        
        ChatMessage message = chatService.sendPaymentRequestMessage(roomId, userId, paymentRequestJson);
        
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setRoomId(message.getRoomId());
        response.setSenderId(message.getSenderId());
        response.setContent(message.getContent());
        response.setType(message.getType().name());
        response.setCreatedAt(message.getCreatedAt());
        response.setReadAt(message.getReadAt());
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Gets chat room with deal info.
     * GET /api/escrow/chat/rooms/{roomId}
     */
    @GetMapping("/chat/rooms/{roomId}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getChatRoom(
        @PathVariable UUID roomId,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId
    ) {
        ChatRoom room = chatService.getUserChatRooms(userId).stream()
            .filter(r -> r.getId().equals(roomId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Chat room not found: " + roomId));
        
        ChatRoomResponse response = new ChatRoomResponse();
        response.setId(room.getId());
        response.setDealId(room.getDealId());
        response.setBuyerId(room.getBuyerId());
        response.setSellerId(room.getSellerId());
        response.setStatus(room.getStatus().name());
        response.setCreatedAt(room.getCreatedAt());
        response.setLastMessageAt(room.getLastMessageAt());
        if (userId != null) {
            response.setUnreadCount(chatService.getUnreadCount(room.getId(), userId));
        }
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
