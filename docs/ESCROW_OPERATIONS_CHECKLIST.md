# Escrow Milestone Release 운영 체크리스트

## 일일 운영 체크리스트

### 결제 후 확인
- [ ] 결제는 했는데 Release 안 됐는가?
  - Deal 조회 API로 마일스톤 상태 확인
  - `PAID_HELD` 상태인 마일스톤 목록 확인
  - 오래된 `PAID_HELD` 상태 마일스톤 확인 (7일 이상)

- [ ] 누가 승인했는가?
  - Audit Log에서 `RELEASE_APPROVED` 이벤트 확인
  - `actor` 필드로 승인자 확인

- [ ] 언제 승인했는가?
  - Audit Log의 `createdAt` 필드 확인
  - 승인 시간과 Release 요청 시간 비교

- [ ] 환불 사유는 기록됐는가?
  - `REFUNDED` 상태 마일스톤 확인
  - Audit Log에서 환불 사유 확인

## 주간 운영 체크리스트

### 상태 불일치 확인
- [ ] `PAID_HELD` 상태인데 Release 요청이 없는 마일스톤
- [ ] `RELEASE_REQUESTED` 상태인데 승인되지 않은 마일스톤 (3일 이상)
- [ ] `RELEASED` 상태인데 실제 송금이 완료되지 않은 마일스톤

### Audit Log 검토
- [ ] 모든 상태 전이가 Audit Log에 기록되었는지 확인
- [ ] 비정상적인 상태 전이 패턴 확인
- [ ] 관리자 승인 이력 검토

## 월간 운영 체크리스트

### 통계 및 리포트
- [ ] 월간 Release 승인 건수
- [ ] 평균 승인 소요 시간
- [ ] 환불 건수 및 사유 분석
- [ ] 상태별 마일스톤 분포

### 보안 검토
- [ ] ADMIN 권한 부여 현황 확인
- [ ] 비정상적인 Release 승인 패턴 확인
- [ ] Audit Log 무결성 확인

## API 엔드포인트 참조

### Deal 조회
```
GET /api/deals/{dealId}
```
- 마일스톤 상태 확인
- 결제 정보 확인

### Release 요청
```
POST /api/deals/{dealId}/milestones/{milestoneId}/release-request
```
- Release 요청 생성
- 상태: `PAID_HELD` → `RELEASE_REQUESTED`

### Release 승인 (ADMIN ONLY)
```
POST /api/admin/deals/{dealId}/milestones/{milestoneId}/release
```
- Release 승인
- 상태: `RELEASE_REQUESTED` → `RELEASED`
- 헤더: `X-User-Role: ADMIN` 필수

### Audit Log 조회
```
GET /api/deals/{dealId}/timeline
```
- 모든 상태 전이 이력 확인
- 승인자 및 시간 확인

## 문제 해결 가이드

### Release 요청이 승인되지 않는 경우
1. 마일스톤 상태 확인: `RELEASE_REQUESTED`인지 확인
2. 관리자 권한 확인: `X-User-Role: ADMIN` 헤더 확인
3. Audit Log 확인: 이전 승인 이력 확인

### 상태 전이가 되지 않는 경우
1. 현재 상태 확인: 전이 가능한 상태인지 확인
2. 역방향 전이 시도 확인: `RELEASED` → `PAID_HELD` 불가
3. 트랜잭션 오류 확인: 로그에서 롤백 이력 확인

### 결제는 했는데 상태가 업데이트되지 않는 경우
1. Webhook 수신 확인: Railway 로그에서 `[WEBHOOK]` 태그 확인
2. 멱등성 확인: 중복 이벤트 처리 여부 확인
3. 수동 동기화: 필요 시 관리자 API로 상태 업데이트

## 연락처

- 기술 지원: [기술팀 연락처]
- 운영 지원: [운영팀 연락처]
- 긴급 상황: [긴급 연락처]
