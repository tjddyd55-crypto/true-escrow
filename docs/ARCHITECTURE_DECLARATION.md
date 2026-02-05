# true-escrow Architecture Declaration (FINAL)

> **이 문서는 설계 결정 확정본으로, 이후 구현·확장 시 기준이 된다.**

## Architecture Overview (FINAL)

### Block 중심 구조

- Transaction은 여러 Block의 **순차 실행 흐름**으로 구성된다
- Block은 **실행·승인·진행의 최소 단위**

### WorkRule 기반 설계

- 거래는 **"마일스톤 나열"이 아니라**
- **작업물의 횟수 / 주기 / 날짜 규칙(WorkRule)** 으로 정의된다

### 자동 생성 모델

- Block이 활성화되면,
- 해당 Block에 정의된 **WorkRule을 기준으로**
- 실제 실행 단위인 **WorkItem이 자동 생성**된다

### 설계 지향 UX

- 사용자는 **"마일스톤을 추가"하지 않는다**
- 대신 **거래 규칙을 설계(Design your transaction)** 한다

## Key Design Decisions

### Milestone 대신 Block / WorkRule 구조 선택

**이유:**
- 거래 유형별(부동산, 마케팅, 외주 등) 유연성
- 반복 작업·기간 기반 계약 표현 가능
- Block 단위 승인/통제가 가능

### 변경 가능 범위 명확화

- **Block 구조 수정은 DRAFT 상태에서만 허용**
- ACTIVE 이후에는:
  - 구조 변경 제한
  - 필요 시 Admin 개입

### 확장 포인트 명시

1. **Block Editor UI**
   → `/transaction/builder/[id]` 의 Block 편집 섹션

2. **WorkRule 편집**
   → Block 내부 WorkRule 추가/수정 UI

3. **Approval Policy**
   → Block별 승인 정책 설정 UI

## 유연성과 엄격성의 균형

### 유연:
- WorkRule의 `frequency` / `quantity` / `due_date`
- 다양한 작업 패턴 지원 (ONCE | DAILY | WEEKLY | CUSTOM)

### 엄격:
- Block 승인 단위 고정
- ACTIVE 이후 구조 잠금

## Implementation Status

### ✅ Completed
- [x] DB 스키마 (blocks, work_rules, work_items, approval_policies, block_approvers)
- [x] Domain Models (Block, WorkRule, WorkItem, ApprovalPolicy, BlockApprover)
- [x] TransactionBuilderService (Block 활성화 시 WorkItem 자동 생성)
- [x] Transaction Builder API
- [x] Frontend: `/transaction/new` (템플릿 선택)
- [x] Frontend: `/transaction/builder/[id]` (Block 편집, Timeline Preview)

### 🚧 In Progress / TODO
- [ ] Block Editor UI 완성 (WorkRule 추가/수정)
- [ ] Approval Policy 설정 UI
- [ ] Block Approver 관리 UI
- [ ] WorkItem 제출/승인 플로우
- [ ] Block 승인 후 다음 Block 활성화 로직

## Core Principles

1. **"Design your transaction"** - 거래를 설계하는 플랫폼
2. **Block 단위 승인** - 세밀한 통제 가능
3. **WorkRule 기반 자동화** - 반복 작업 패턴 지원
4. **DRAFT/ACTIVE 분리** - 설계 단계와 실행 단계 명확히 구분

---

**Last Updated:** 2025-01-XX  
**Status:** FINAL (Design Decision Locked)
