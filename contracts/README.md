# Escrow Status Registry Smart Contract

## 목적 (Purpose)

이 스마트 컨트랙트는 **에스크로 마일스톤의 최종 결정을 온체인에 기록**하여 불변성과 비가역성을 보장합니다.

**중요**: 이 컨트랙트는 **자금을 처리하지 않습니다**. 단지 상태 결정을 기록하는 역할만 합니다.

## 핵심 보장 사항 (Guarantees)

1. **불변성 (Immutability)**
   - 한 번 기록된 상태는 수정/삭제 불가
   - 업데이트 함수 없음
   - 삭제 함수 없음
   - 관리자 오버라이드 없음

2. **비가역성 (Non-reversibility)**
   - `RELEASED` 또는 `REFUNDED`가 기록되면, 해당 마일스톤에 다른 상태 기록 불가
   - 최종 결정은 영구적으로 고정됨

3. **중복 방지 (Idempotency)**
   - 동일한 `(dealHash, milestoneHash, status)` 조합은 한 번만 기록 가능

## 상태 값 (Status Values)

```solidity
STATUS_FUNDS_HELD = 0  // 자금 보류 중
STATUS_RELEASED = 1    // 지급 완료
STATUS_REFUNDED = 2    // 환불 완료
```

## 주요 함수 (Key Functions)

### Write Functions

#### `recordStatus(bytes32 dealHash, bytes32 milestoneHash, uint8 status)`
- **권한**: `onlyOwner` (백엔드 지갑만 호출 가능)
- **기능**: 마일스톤 상태를 온체인에 기록
- **규칙**:
  - 동일한 `(dealHash, milestoneHash, status)` 조합은 한 번만 기록 가능
  - `RELEASED` 또는 `REFUNDED` 기록 후에는 다른 상태 기록 불가
  - `FUNDS_HELD`는 여러 번 기록 가능 (상태 업데이트 허용)

### Read Functions

#### `getRecord(bytes32 recordKey)`
- **기능**: 특정 레코드를 조회
- **반환**: `Record` 구조체 (dealHash, milestoneHash, status, timestamp)

#### `isRecorded(bytes32 dealHash, bytes32 milestoneHash, uint8 status)`
- **기능**: 특정 상태가 기록되었는지 확인
- **반환**: `bool`

#### `getFinalStatus(bytes32 dealHash, bytes32 milestoneHash)`
- **기능**: 마일스톤의 최종 상태 조회 (RELEASED 또는 REFUNDED)
- **반환**: `uint8` (0 = 없음, 1 = RELEASED, 2 = REFUNDED)

## 이벤트 (Events)

### `StatusRecorded`
```solidity
event StatusRecorded(
    bytes32 indexed dealHash,
    bytes32 indexed milestoneHash,
    uint8 status,
    uint256 timestamp
);
```

## 배포 (Deployment)

### 사전 요구사항

1. Node.js 설치
2. Hardhat 설치: `npm install`
3. 환경 변수 설정 (`.env` 파일):
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=your_backend_wallet_private_key
   ```

### 배포 명령어

```bash
# Sepolia 테스트넷에 배포
npm run deploy:sepolia

# 로컬 Hardhat 네트워크에 배포
npm run deploy:local
```

### 배포 후

1. 컨트랙트 주소를 백엔드 환경 변수에 저장:
   ```
   ESCROW_CONTRACT_ADDRESS=0x...
   ```

2. 백엔드 `BlockchainService`에서 이 컨트랙트를 호출하도록 설정

## 보안 고려사항 (Security Considerations)

1. **Reentrancy**: 자금을 처리하지 않으므로 관련 없음
2. **Gas 최적화**: 최소한의 스토리지 사용
3. **명시적 에러 메시지**: 모든 `require` 문에 명확한 메시지 포함
4. **Access Control**: `onlyOwner` 모디파이어로 쓰기 권한 제한

## 사용 예시 (Usage Example)

### 백엔드에서 호출

```javascript
// Web3.js 예시
const contract = new web3.eth.Contract(abi, contractAddress);

// dealId와 milestoneId를 해시로 변환
const dealHash = web3.utils.keccak256(dealId);
const milestoneHash = web3.utils.keccak256(milestoneId);

// 상태 기록 (RELEASED = 1)
await contract.methods.recordStatus(
  dealHash,
  milestoneHash,
  1  // STATUS_RELEASED
).send({
  from: backendWalletAddress,
  gas: 100000
});
```

### 조회

```javascript
// 상태가 기록되었는지 확인
const recordKey = web3.utils.keccak256(
  web3.utils.encodePacked(dealHash, milestoneHash, 1)
);
const isRecorded = await contract.methods.isRecorded(
  dealHash,
  milestoneHash,
  1
).call();

// 최종 상태 조회
const finalStatus = await contract.methods.getFinalStatus(
  dealHash,
  milestoneHash
).call();
```

## 아키텍처 통합 (Architecture Integration)

이 컨트랙트는 다음 시점에 호출됩니다:

1. **결제 완료** → `FUNDS_HELD` 기록
2. **관리자 승인** → `RELEASED` 기록
3. **환불 결정** → `REFUNDED` 기록
4. **분쟁 해결** → `RELEASED` 또는 `REFUNDED` 기록

백엔드 `BlockchainService.recordMilestoneStatus()` 메서드에서 이 컨트랙트를 호출합니다.

## 테스트 (Testing)

```bash
# Hardhat 테스트 실행
npm test
```

## 검증 (Verification)

Etherscan에서 컨트랙트 소스 코드 검증:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 라이선스 (License)

MIT
