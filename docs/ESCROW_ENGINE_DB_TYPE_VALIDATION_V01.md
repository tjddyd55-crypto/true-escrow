# Escrow Engine – DB / Type / Validation 통합 지시문 (v0.1)

## 🎯 목표

템플릿 기반 에스크로 거래가 **DB → 서버 → UI → 블록체인** 전 구간에서 상태 불일치 없이 동작하도록 한다.

---

## 1. 핵심 설계 원칙 (이거 어기면 안 됨)

| 원칙 | 설명 |
|------|------|
| **DB가 SSOT** | 상태 판단은 전부 DB 기준 |
| **타입은 DB에서 파생** | 코드 타입이 DB를 추측하면 안 됨 |
| **엔진은 상태 머신만 담당** | — |
| **UI는 절대 판단하지 않는다** | — |
| **블록체인은 "승인 사실"만 기록** | — |

---

## 2. DB 스키마 (필수 테이블)

### 2-1. escrow_templates

"초기 제안값"만 저장 (고정 계약 아님).

```sql
CREATE TABLE escrow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,  -- QUICK_DELIVERY, MOVING_SERVICE
  label TEXT NOT NULL,
  defaults JSONB NOT NULL,
  constraints JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2-2. escrow_trades

실제 거래 인스턴스 (핵심).

```sql
CREATE TABLE escrow_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_trade_id TEXT NOT NULL,  -- 외부 시스템용
  template_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL,  -- CREATED, IN_PROGRESS, PAYABLE, COMPLETED, DISPUTED
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

⚠️ **중요**

- `status`는 ENUM처럼 사용하지만 **TEXT + 엔진 검증**
- 외부 시스템 연동 대비 **client_trade_id 필수**

### 2-3. escrow_blocks (마일스톤)

```sql
CREATE TABLE escrow_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES escrow_trades(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,  -- 순서
  title TEXT NOT NULL,
  description TEXT,
  amount_type TEXT NOT NULL,  -- FULL | RATIO | FIXED
  amount_value NUMERIC,       -- 비율 or 금액
  approver_role TEXT NOT NULL, -- buyer | seller | admin
  auto_approve BOOLEAN DEFAULT false,
  timeout_interval INTERVAL,
  status TEXT NOT NULL,  -- PENDING | APPROVABLE | APPROVED | PAID
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ
);

-- DB 레벨 보장
CREATE UNIQUE INDEX ux_trade_block_sequence
  ON escrow_blocks(trade_id, sequence);
```

### 2-4. escrow_block_conditions (조건)

```sql
CREATE TABLE escrow_block_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES escrow_blocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  fulfilled BOOLEAN DEFAULT false
);
```

### 2-5. escrow_approvals (승인 로그)

```sql
CREATE TABLE escrow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES escrow_blocks(id) ON DELETE CASCADE,
  approved_by TEXT NOT NULL,   -- buyer_id / seller_id / admin_id
  approved_role TEXT NOT NULL,
  tx_hash TEXT,                -- 블록체인
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 중복 승인 방지
CREATE UNIQUE INDEX ux_block_single_approval
  ON escrow_approvals(block_id);
```

---

## 3. 서버 타입 정의 (DB 기준 파생)

- ❌ 프론트에서 임의로 타입 정의 금지  
- ⭕ 이 구조 그대로 사용

```ts
export type EscrowTradeStatus =
  | 'CREATED'
  | 'IN_PROGRESS'
  | 'PAYABLE'
  | 'COMPLETED'
  | 'DISPUTED';

export type EscrowBlockStatus =
  | 'PENDING'
  | 'APPROVABLE'
  | 'APPROVED'
  | 'PAID';

export type ApproverRole = 'buyer' | 'seller' | 'admin';
```

---

## 3-2. 상태 전이 허용 (문서 기준 · 코드에 하드코딩 금지)

아래는 **문서/QA/API 스펙용**이다. 코드에서는 ENUM으로 고정하지 말고, **엔진이 허용 전이만 허용**하도록 검증한다.

### EscrowTradeStatus 전이

| From | To | 조건 |
|------|-----|------|
| `CREATED` | `IN_PROGRESS` | 첫 블록 생성 완료 |
| `IN_PROGRESS` | `PAYABLE` | 모든 지급 조건 충족 |
| `PAYABLE` | `COMPLETED` | 지급 완료 |
| **ANY** | `DISPUTED` | 관리자 개입 |

### EscrowBlockStatus 전이

| From | To | 조건 |
|------|-----|------|
| `PENDING` | `APPROVABLE` | 이전 블록 승인 완료 |
| `APPROVABLE` | `APPROVED` | 승인 완료 |
| `APPROVED` | `PAID` | 지급 완료 |

- ⚠️ **역행 없음** (APPROVED → APPROVABLE 등 불가)
- ⚠️ **건너뛰기 없음** (PENDING → APPROVED 불가)

문서에만 명시해 두면 “왜 이 상태가 안 되지?” 질문이 줄어든다.

---

## 4. 엔진 레벨 Validation Rule (무조건 구현)

### 4-1. 블록 순서

- **sequence N** 블록이 **APPROVED** 되기 전  
  → **sequence N+1**은 **APPROVABLE** 불가

### 4-2. 승인 조건

- 조건(`is_required = true`) 전부 **fulfilled**
- 승인자 **role** 일치
- 승인 로그 **중복 ❌**

### 4-3. 수정 불가 필드 방어 (이중)

| 레이어 | 대상 | 조치 |
|--------|------|------|
| **서버** | locked 필드 포함 요청 | `if (payload.includesLockedField) throw 403` |
| **DB** | `sequence`, `trade_id`, `approver_role` | UPDATE 자체를 막거나 무시 |

### 4-4. DB 트랜잭션 경계

**블록 승인 + 상태 변경 + 승인 로그 기록은 반드시 단일 트랜잭션으로 처리한다.**

이 원칙이 없으면 “승인 로그는 있는데 블록 상태는 안 바뀌는” 최악의 금융 사고 케이스가 생길 수 있다.

---

## 5. UI에서 반드시 표현해야 할 것 (테스트 편의용)

### 🔒 수정 불가 필드

- 회색 배경
- 자물쇠 아이콘
- tooltip: *"에스크로 안전 규칙상 수정할 수 없습니다."*

### ✏️ 수정 가능 필드

- 일반 입력
- *"초기 제안값입니다"* 안내 문구

---

## 6. 개발 순서 지시문 (이 순서로만 진행)

1. DB 스키마 전부 생성  
2. 더미 템플릿 2개 삽입 (`QUICK_DELIVERY`, `MOVING_SERVICE`)  
3. 거래 생성 API  
4. 블록 생성 로직  
5. 승인 로직  
6. 상태 전이 검증  
7. 블록체인 승인 기록  
8. UI 연결  

👉 **순서 바꾸면 오류 난다.**

---

## 7. 지금 단계에서 "절대 하지 말 것"

- ❌ API 공개  
- ❌ 외부 시스템 연동  
- ❌ 상태 ENUM 하드코딩  
- ❌ 프론트 단 판단  

---

## 8. 이 세트가 완성되면 얻는 것

- DB ↔ 타입 ↔ 엔진 완전 정합  
- QA 시 "어디가 문제인지" 바로 추적  
- 이후 API 오픈 시 스펙 그대로 재사용  

---

## 9. 관련 문서 및 현재 코드베이스

| 항목 | 설명 |
|------|------|
| **템플릿 스펙** | `docs/ESCROW_TEMPLATE_SYSTEM_SPEC_V01.md` (defaults/constraints, Editable/Locked) |
| **현재 엔진** | `escrow-ui` 쪽은 **메모리 JSON 스토어** (`lib/transaction-engine/store.ts`) + `Transaction` / `Block` / `WorkRule` 등 별도 도메인. 본 문서의 **DB 스키마·타입·검증**은 **DB 기반 엔진** 도입 시 적용할 설계. |
| **마이그레이션** | DB 도입 시 Flyway 등으로 위 DDL 순서대로 적용 후, 기존 메모리 엔진과 병행/대체 계획 필요. |
