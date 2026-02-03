# Milestone-based Escrow Payment Flow

## 핵심 원칙

본 플랫폼은 거래 금액을 즉시 판매자에게 지급하지 않습니다.
모든 결제 금액은 Lemon Squeezy를 통해 에스크로로 보관되며,
사전에 정의된 마일스톤이 충족되고 승인되기 전까지
어떤 주체도 임의로 자금을 인출할 수 없습니다.

## 플로우 요약

### 1. 구매자 결제
- 구매자가 Lemon Squeezy를 통해 결제 진행
- 결제 금액은 즉시 판매자 계좌로 입금되지 않음

### 2. 자금 → Escrow 보관 (FUNDS_HELD)
- 결제 완료 시 Webhook을 통해 시스템에 알림
- 마일스톤 상태가 `PAID_HELD`로 전이
- Deal 상태가 `FUNDS_HELD`로 전이
- 자금은 에스크로 계좌에 보관됨

### 3. 마일스톤 완료 후 Release 요청
- 구매자 또는 판매자가 마일스톤 완료를 확인
- Release 요청 API 호출 (`POST /api/deals/:dealId/milestones/:milestoneId/release-request`)
- 마일스톤 상태가 `RELEASE_REQUESTED`로 전이
- 관리자 승인 대기 상태

### 4. 관리자 승인
- 관리자만 Release 승인 가능 (`POST /api/admin/deals/:dealId/milestones/:milestoneId/release`)
- 승인 시 마일스톤 상태가 `RELEASED`로 전이
- 모든 마일스톤이 Release되면 Deal 상태가 `COMPLETED`로 전이
- (추후 실제 송금 API 연결)

### 5. 지급 완료 또는 환불
- `RELEASED`: 승인 완료, 지급 처리
- `REFUNDED`: 환불 처리 (Webhook 또는 관리자 조치)

## 상태 전이 규칙

### Milestone Status
```
PENDING → PAID_HELD → RELEASE_REQUESTED → RELEASED
                              ↓
                          REFUNDED
```

**역방향 전이 금지:**
- `RELEASED` → `PAID_HELD` ❌
- `REFUNDED` → `RELEASED` ❌

### Deal Status
```
CREATED → FUNDS_HELD → IN_PROGRESS → COMPLETED
```

## 보안 및 통제

### 승인 주체 모델
- **BUYER/SELLER**: Release 요청 가능
- **ADMIN**: 최종 승인/반려 권한

### Audit Log
모든 상태 전이는 Audit Log에 기록됩니다:
- `RELEASE_REQUESTED`: Release 요청 기록
- `RELEASE_APPROVED`: 관리자 승인 기록
- `RELEASE_REJECTED`: 관리자 반려 기록 (향후 구현)

### API 직접 호출 우회 불가
- Release 승인 API는 ADMIN 권한 필수
- 상태 전이는 엄격한 검증을 거침
- 모든 전이는 Audit Log로 추적 가능

## 기술 스택

- **결제 게이트웨이**: Lemon Squeezy
- **Webhook**: 자동 상태 동기화
- **멱등성**: 중복 이벤트 처리 방지
- **트랜잭션**: 원자적 상태 전이 보장

## 운영 체크리스트

### 결제 후 확인
- [ ] 결제는 했는데 Release 안 됐는가?
- [ ] 누가 승인했는가?
- [ ] 언제 승인했는가?
- [ ] 환불 사유는 기록됐는가?

→ 모두 Audit Log로 추적 가능

## 심사/투자자 설명용

본 시스템은 단순한 결제 서비스가 아닌,
**에스크로 + 승인 + 통제 구조를 가진 플랫폼**입니다.

- 자금은 반드시 에스크로에 보관됨
- 승인 없이는 지급 불가
- 모든 전이는 감사 로그로 추적 가능
- 역방향 전이 불가 (되돌릴 수 없음)

이는 금융 규제 준수 및 고객 신뢰 구축을 위한 핵심 구조입니다.
