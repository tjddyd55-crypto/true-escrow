# Blockchain Integration Guide (STEP 7-B)

## 개요

백엔드 서버와 EscrowStatusRegistry 스마트 컨트랙트를 연계하여 마일스톤 상태를 온체인에 기록합니다.

## 핵심 원칙

1. **서버 상태 전이 → 온체인 기록**
   - 서버에서 상태가 변경되면 자동으로 온체인에 기록
   - 서버 상태와 온체인 상태는 1:1로 연결

2. **서버 키 관리**
   - Backend 전용 Wallet 1개
   - `.env`에 `BLOCKCHAIN_PRIVATE_KEY` 저장
   - 관리자 UI에서 직접 호출 불가 (항상 서버를 통해서만)

3. **불변성 보장**
   - 서버 로그 → 조작 가능
   - DB → 관리자 변경 가능
   - 블록체인 → 변경 불가
   - 분쟁 시 외부 증명 가능

## 상태 전이 → 온체인 기록 매핑

| 서버 상태 전이 | 온체인 기록 | 호출 위치 |
|---------------|-----------|----------|
| FUNDS_HELD 확정 | `recordStatus(FUNDS_HELD)` | `LemonWebhookService` |
| RELEASED 승인 | `recordStatus(RELEASED)` | `MilestoneReleaseController` |
| REFUNDED 결정 | `recordStatus(REFUNDED)` | `LemonWebhookService` (환불) / `AdminDisputeController` (분쟁 해결) |

## 환경 변수 설정

```bash
# Blockchain 활성화
BLOCKCHAIN_ENABLED=true

# RPC URL (Sepolia 테스트넷)
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 컨트랙트 주소 (배포 후 설정)
ESCROW_CONTRACT_ADDRESS=0x...

# Backend 전용 Wallet Private Key
BLOCKCHAIN_PRIVATE_KEY=0x...

# 네트워크 이름
BLOCKCHAIN_NETWORK=sepolia
```

## 배포 및 설정 절차

### 1. 스마트 컨트랙트 배포

```bash
cd contracts
npm install
npm run deploy:sepolia
```

배포 후 컨트랙트 주소를 복사하여 `ESCROW_CONTRACT_ADDRESS`에 설정합니다.

### 2. Backend Wallet 생성

```bash
# Web3 CLI로 새 지갑 생성 (또는 MetaMask 사용)
# Private Key를 안전하게 보관하고 .env에 설정
```

### 3. 환경 변수 설정

Railway 또는 배포 환경의 환경 변수에 위의 값들을 설정합니다.

### 4. 서버 재시작

환경 변수 변경 후 서버를 재시작합니다.

## 구현 세부사항

### BlockchainContractService

- Web3j를 사용하여 스마트 컨트랙트와 직접 통신
- `recordStatus()`: 온체인에 상태 기록
- `isRecorded()`: 상태가 이미 기록되었는지 확인 (idempotency)

### BlockchainService

- 비즈니스 로직 레이어
- `recordMilestoneStatus()`: DB에 기록 + 온체인 기록 트리거
- 상태 매핑: `OnChainRecord.RecordStatus` → 컨트랙트 status (0, 1, 2)

### 호출 위치

1. **LemonWebhookService** (`handleOrderCreated`)
   - 결제 완료 시 `FUNDS_HELD` 기록

2. **LemonWebhookService** (`handleOrderRefunded`)
   - 환불 시 `REFUNDED` 기록

3. **MilestoneReleaseController** (`approveRelease`)
   - 관리자 승인 시 `RELEASED` 기록

4. **AdminDisputeController** (`resolveDispute`)
   - 분쟁 해결 시 `RELEASED` 또는 `REFUNDED` 기록

## 보안 고려사항

1. **Private Key 보안**
   - 절대 코드에 하드코딩하지 않음
   - 환경 변수로만 관리
   - 버전 관리 시스템에 커밋하지 않음

2. **에러 처리**
   - 온체인 기록 실패가 비즈니스 로직을 막지 않음
   - 로그에 기록하고 계속 진행

3. **Idempotency**
   - 동일 상태 중복 기록 방지
   - 컨트랙트 레벨에서도 체크

## 완료 기준

✅ 스마트 컨트랙트 배포 완료 (testnet)  
✅ FUNDS_HELD / RELEASED / REFUNDED 기록 가능  
✅ 동일 상태 중복 기록 불가  
✅ RELEASED 이후 다른 상태 기록 불가  
✅ 서버 상태와 온체인 상태 불일치 없음

## 테스트

1. 결제 완료 → `FUNDS_HELD` 온체인 기록 확인
2. 관리자 승인 → `RELEASED` 온체인 기록 확인
3. 환불 → `REFUNDED` 온체인 기록 확인
4. Etherscan에서 트랜잭션 확인

## 트러블슈팅

### "Blockchain integration is disabled"
- `BLOCKCHAIN_ENABLED=true` 설정 확인

### "Contract address not configured"
- `ESCROW_CONTRACT_ADDRESS` 설정 확인

### "Private key not configured"
- `BLOCKCHAIN_PRIVATE_KEY` 설정 확인

### Transaction 실패
- RPC URL 확인
- Private Key 형식 확인 (0x prefix)
- 컨트랙트 주소 확인
- Gas 가격 확인
