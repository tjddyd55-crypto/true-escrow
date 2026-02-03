# Escrow + Chat + Payment MVP Implementation Summary

## 구현 완료 항목

### 1. 백엔드 (Java/Spring Boot)

#### 엔티티 모델
- ✅ `ChatRoom` - 채팅방 엔티티 (상태 표시용, Escrow는 별도 도메인)
- ✅ `ChatMessage` - 채팅 메시지 엔티티
- ✅ `PaymentInfo` - 결제 정보 엔티티 (결제 설정 전용 페이지)
- ✅ `DealMilestone` - 거래 마일스톤 엔티티 (최대 3단계)

#### Repository
- ✅ `ChatRoomRepository` - 채팅방 조회 (참가자별, 상태별)
- ✅ `ChatMessageRepository` - 메시지 조회 (읽지 않은 메시지 카운트)
- ✅ `PaymentInfoRepository` - 결제 정보 조회
- ✅ `DealMilestoneRepository` - 마일스톤 조회

#### 서비스
- ✅ `ChatService` - 채팅방 생성/조회, 메시지 전송/조회, 읽음 처리
- ✅ `PaymentService` - 결제 정보 생성/업데이트, 상태 관리
- ✅ `MilestoneService` - 마일스톤 생성/조회/상태 업데이트 (최대 3개 제한)

#### API 컨트롤러
- ✅ `EscrowController` - Escrow + Chat + Payment 통합 API
  - `POST /api/escrow/create` - 거래 생성 (Deal + ChatRoom + PaymentInfo + Milestones)
  - `GET /api/escrow/chat/rooms` - 사용자 채팅방 목록 (카드 기반 UX)
  - `GET /api/escrow/chat/rooms/{roomId}/messages` - 메시지 조회
  - `POST /api/escrow/chat/rooms/{roomId}/messages` - 메시지 전송
  - `GET /api/escrow/payment/{dealId}` - 결제 정보 조회
  - `PUT /api/escrow/payment/{dealId}` - 결제 정보 업데이트 (결제 설정 페이지)
  - `GET /api/escrow/milestones/{dealId}` - 마일스톤 조회

#### DTO
- ✅ `CreateEscrowDealRequest` - 거래 생성 요청
- ✅ `MilestoneRequest` - 마일스톤 요청
- ✅ `ChatRoomResponse` - 채팅방 응답
- ✅ `ChatMessageResponse` - 메시지 응답
- ✅ `PaymentInfoResponse` - 결제 정보 응답
- ✅ `MilestoneResponse` - 마일스톤 응답

### 2. 프론트엔드 (Next.js)

#### 페이지
- ✅ `/chat` - 채팅방 목록 페이지 (카드 기반 UX)
- ✅ `/chat/[roomId]` - 채팅방 상세 페이지 (메시지 전송/수신)
- ✅ `/payment/[dealId]` - 결제 설정 페이지 (전용 페이지)

#### API 라우트
- ✅ `/api/escrow/chat/rooms` - 채팅방 목록 프록시
- ✅ `/api/escrow/chat/rooms/[roomId]/messages` - 메시지 조회/전송 프록시
- ✅ `/api/escrow/payment/[dealId]` - 결제 정보 조회/업데이트 프록시

### 3. 데이터베이스

#### 마이그레이션
- ✅ `V999__create_chat_payment_milestone_tables.sql`
  - `chat_rooms` 테이블
  - `chat_messages` 테이블
  - `payment_infos` 테이블
  - `deal_milestones` 테이블 (최대 3개 제약)

## 아키텍처 원칙 준수

### Chat은 상태 표시, Escrow는 별도 도메인
- ✅ ChatRoom은 Deal과 연결되지만 독립적인 도메인
- ✅ Chat은 상태 표시용 (SYSTEM 메시지 타입 지원)
- ✅ Escrow 로직은 기존 DealApplicationService와 분리

### 채팅방 카드 기반 UX
- ✅ 채팅방 목록을 카드 형태로 표시
- ✅ 읽지 않은 메시지 수 표시
- ✅ 마지막 메시지 시간 표시

### 결제 설정 전용 페이지
- ✅ `/payment/[dealId]` 전용 페이지
- ✅ 결제 방법 및 제공자 선택 UI
- ✅ 결제 상태 표시

### 마일스톤 최대 3단계
- ✅ `DealMilestone` 엔티티에 `orderIndex` 제약 (1-3)
- ✅ `MilestoneService`에서 최대 3개 제한 검증

## API 엔드포인트

### POST /api/escrow/create
거래 생성 (Deal + ChatRoom + PaymentInfo + Milestones)

**Request:**
```json
{
  "buyerId": "uuid",
  "sellerId": "uuid",
  "itemRef": "string",
  "category": "USED_CAR",
  "totalAmount": 10000.00,
  "currency": "USD",
  "milestones": [
    {
      "title": "Milestone 1",
      "description": "Description",
      "amount": 3000.00,
      "orderIndex": 1
    }
  ]
}
```

### GET /api/escrow/chat/rooms
사용자 채팅방 목록 (카드 기반 UX)

**Headers:**
- `X-User-Id: uuid`

### GET /api/escrow/chat/rooms/{roomId}/messages
메시지 조회

### POST /api/escrow/chat/rooms/{roomId}/messages
메시지 전송

**Request:**
```json
{
  "content": "Message text"
}
```

### GET /api/escrow/payment/{dealId}
결제 정보 조회

### PUT /api/escrow/payment/{dealId}
결제 정보 업데이트 (결제 설정 페이지)

**Request:**
```json
{
  "buyerId": "uuid",
  "paymentMethod": "CARD",
  "paymentProvider": "LEMON_SQUEEZY"
}
```

### GET /api/escrow/milestones/{dealId}
마일스톤 조회

## 다음 단계

1. E2E 테스트 작성
2. 에러 처리 개선
3. 실시간 메시지 업데이트 (WebSocket 또는 Server-Sent Events)
4. 결제 웹훅 통합
5. 마일스톤 완료 시 자동 처리 로직
