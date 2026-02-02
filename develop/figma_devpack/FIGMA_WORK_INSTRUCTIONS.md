# Figma 작업 지시서 (Figma Work Instructions)

이 문서는 Trust & Escrow 플랫폼의 UI 구현을 위한 Figma 작업 지시서입니다.
각 Figma 파일(00→05)에 대한 구체적인 작업 가이드를 제공합니다.

**중요**: 
- Cursor DevPack의 용어를 정확히 사용하고, 새로운 UI 개념을 발명하지 마세요.
- **i18n 규칙 준수 필수**: 모든 UI 컴포넌트는 이중 레이블 형식(Canonical Key + Localized Label)을 사용해야 합니다.
- 자세한 i18n 규칙은 `I18N_AND_LOCALIZATION_RULES.md`를 참조하세요.

---

# 00 — Figma SSOT Overview

## 목적 (Why this file exists)
이 파일은 전체 Figma DevPack의 구조와 원칙을 정의합니다. 
디자이너와 개발자가 UI 설계의 근본 원칙을 이해하고, 
"예쁜 UI"가 아닌 "구조적 UI"를 만들기 위한 기준을 제공합니다.

## Required Frames
1. **Core UI Principles Poster**
   - 6가지 핵심 원칙을 시각화
   - 각 원칙에 대한 간단한 설명 포함

2. **File Structure Map**
   - 6개 Figma 파일(00→05)의 관계도
   - 각 파일의 목적과 연결 관계

3. **Terminology Reference**
   - Cursor DevPack에서 사용하는 정확한 용어 목록 (Canonical Keys)
   - DealState: CREATED, FUNDED, DELIVERED, INSPECTION, APPROVED, ISSUE, SETTLED
   - IssueReasonCode: NOT_DELIVERED, DAMAGE_MAJOR, DAMAGE_MINOR, MISSING_PARTS, QUALITY_NOT_MATCHING, DOCUMENT_MISMATCH, OTHER
   - Timer Types: AUTO_APPROVE, DISPUTE_TTL, HOLDBACK_RELEASE
   - LedgerEntryType: HOLD, RELEASE, REFUND, OFFSET
   - **이중 레이블 형식 예시**: `INSPECTION / 검수 중` (Canonical Key / Localized Label)

## Required Components
- 없음 (개요 파일이므로 컴포넌트 없음)

## Do-Not-Break Rules
1. **용어 변경 금지**: Cursor DevPack의 용어(Canonical Keys)를 그대로 사용
2. **Canonical Key 번역 금지**: `INSPECTION`을 `검수중`으로 변경하거나 번역하지 않음
3. **이중 레이블 필수**: 모든 상태/타이머/코드는 `[Canonical Key] / [Localized Label]` 형식 사용
4. **원칙 단순화 금지**: 6가지 핵심 원칙을 생략하거나 약화하지 않음
5. **새로운 개념 추가 금지**: SSOT에 없는 UI 개념을 추가하지 않음

## Done Criteria
- 새로운 팀원이 이 파일만 보고도 전체 UI 구조의 철학을 이해할 수 있어야 함
- Cursor DevPack과의 용어 일관성이 명확히 드러나야 함
- 6가지 핵심 원칙이 시각적으로 명확하게 표현되어야 함

---

# 01 — Information Architecture & Navigation

## 목적 (Why this file exists)
앱의 정보 구조와 네비게이션을 정의하여, 
사용자가 Deal(거래) 중심의 플랫폼임을 명확히 하고,
타임라인, 증빙, 금전 요약, 액션의 4개 기둥이 항상 접근 가능하도록 보장합니다.

## Required Frames

### 1. App-Level Navigation Map
- **Home**: 메인 랜딩 페이지
- **Listings**: 거래 목록 (카테고리별: CAR, REAL_ESTATE_RENTAL, REAL_ESTATE_SALE, HIGH_VALUE_USED, B2B_DELIVERY)
- **Deal (Transaction)**: 거래 상세 페이지 (핵심 페이지)
- **Admin (Ops)**: 관리자 운영 페이지

### 2. Deal-Centric IA Map
Deal Detail 페이지는 반드시 4개 기둥을 포함:
- **Timeline (State Machine)**: 상태 머신 타임라인
  - CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED
  - ISSUE는 오버레이로 표시
- **Actions (Role-based)**: 역할 기반 액션 패널
  - Buyer actions / Seller actions / System actions
- **Evidence**: 증빙 패널
  - EvidenceMetadata 목록 (photo/video/report)
  - 업로드 기능
- **Money Summary**: 금전 요약 패널
  - Immediate amount (70% 기본값)
  - Holdback amount (30% 기본값)
  - Ledger view 링크

### 3. Role-Based Entry Points
- **Buyer View**: 
  - Approve 버튼 (INSPECTION 상태)
  - Raise issue 버튼 (INSPECTION 상태)
  - Upload evidence 버튼 (ISSUE 상태)
  - Timer 표시 (AUTO_APPROVE, DISPUTE_TTL)
- **Seller View**:
  - Mark delivered 버튼 (FUNDED 상태)
  - Upload evidence 버튼 (DELIVERED 상태)
  - View release conditions (APPROVED 상태)
- **Admin View**:
  - Dispute list (ISSUE/DISPUTE_OPEN 상태 필터)
  - Time remaining (TTL) 표시
  - Resolve constrained (규칙 허용 결과만 선택)

## Required Components
1. **Navigation Bar Component**
   - Home / Listings / Deal / Admin 링크
   - 현재 페이지 하이라이트

2. **Deal Detail Layout Component**
   - 4개 기둥을 배치하는 레이아웃
   - 반응형 고려 (모바일/데스크톱)

3. **Role-Based Action Panel Component**
   - Buyer/Seller/Admin에 따른 액션 버튼 표시
   - 상태에 따른 액션 활성화/비활성화

## Do-Not-Break Rules
1. **Deal은 1급 시민**: Deal이 Listings 아래에 묻히지 않도록 명확한 네비게이션
2. **Money Summary 항상 접근 가능**: 금전 관련 모든 경로에서 Money Summary 패널 표시
3. **Timeline 1클릭 접근**: 타임라인은 항상 1클릭 내 접근 가능
4. **4개 기둥 누락 금지**: Deal Detail에서 Timeline/Actions/Evidence/Money Summary 중 하나도 생략 불가

## Done Criteria
- 새로운 팀원이 이 파일을 열고 2분 내 앱 구조를 설명할 수 있어야 함
- Deal 중심의 플랫폼임이 명확히 드러나야 함
- 4개 기둥이 모두 시각적으로 명확하게 표현되어야 함

---

# 02 — Transaction Timeline UI

## 목적 (Why this file exists)
상태 머신과 타이머를 한눈에 이해할 수 있도록 시각화하여,
이 플랫폼이 일반 마켓플레이스와 다른 점(규칙 기반 자동 정산)을 명확히 전달합니다.

## Required Frames

### 1. Timeline — Default (Happy Path)
- **레이아웃**: 수평 또는 수직 타임라인
- **상태 순서**: CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED
- **각 노드 표시 항목**:
  - State name (이중 레이블: `INSPECTION / 검수 중`)
  - Short meaning line (상태 의미 설명, 현지화 가능)
  - Timer (활성화된 경우만 표시, 이중 레이블: `AUTO_APPROVE / 자동 승인`)
    - AUTO_APPROVE timer (INSPECTION 상태)
    - DISPUTE_TTL timer (ISSUE/DISPUTE_OPEN 상태)
    - HOLDBACK_RELEASE timer/condition (APPROVED 상태)
  - Who acts (buyer/seller/system, 현지화 가능)

### 2. Timeline — With ISSUE Overlay
- **기본 타임라인**: Happy path 타임라인 유지
- **ISSUE 오버레이 레이어**:
  - ISSUE 상태를 오버레이로 표시 (기존 타임라인 위에, 이중 레이블: `ISSUE / 문제 제기`)
  - Reason code 표시 (이중 레이블 형식: `NOT_DELIVERED / 미배송`, `DAMAGE_MAJOR / 심각한 손상` 등)
  - Evidence required indicator (증빙 필수 표시, 현지화 가능)
  - Dispute TTL countdown (남은 시간 표시, `DISPUTE_TTL / 분쟁 TTL` 표시)
  - Allowed outcomes (규칙에서 허용된 결과를 상위 레벨로 표시, 현지화 가능)

### 3. Timeline — Auto-Approve Visualization
- **INSPECTION 상태 강조**:
  - AUTO_APPROVE timer가 0에 도달하면 APPROVED로 전환 (system 액션)
  - "buyer no response → auto approve" 메시지 강조
  - 타이머 카운트다운 시각화

## Required Components
1. **Timeline Node Component**
   - State name (이중 레이블: Canonical Key + Localized Label)
   - Meaning line (현지화 가능)
   - Timer slot (optional, 이중 레이블 형식)
   - Actor indicator (buyer/seller/system, 현지화 가능)
   - 상태별 스타일 (active/completed/pending)

2. **ISSUE Overlay Component**
   - Reason code badge (이중 레이블: `NOT_DELIVERED / 미배송`)
   - Evidence required banner (현지화 가능)
   - TTL countdown (이중 레이블: `DISPUTE_TTL / 분쟁 TTL`)
   - Allowed outcomes preview (현지화 가능)

3. **Timer Component**
   - Countdown display
   - Timer type indicator (이중 레이블: `AUTO_APPROVE / 자동 승인`, `DISPUTE_TTL / 분쟁 TTL`, `HOLDBACK_RELEASE / 보류 해제`)
   - Explanation text (현지화 가능)

## Do-Not-Break Rules
1. **타이머 항상 표시**: 활성화된 타이머는 절대 숨기지 않음
   - Auto-approve timer (INSPECTION)
   - Dispute TTL (ISSUE/DISPUTE_OPEN)
   - Holdback release timer/condition (APPROVED)
2. **Pause 금지**: "일시정지" 기능 제공 금지
3. **Manual settle 금지**: Buyer/Seller 뷰에서 "수동 정산" 버튼 제공 금지
4. **ISSUE는 오버레이**: ISSUE가 메인 플로우를 영구적으로 대체하지 않음
5. **용어 정확성**: DealState 이름을 정확히 사용 (CREATED, FUNDED 등)

## Done Criteria
- 이 파일만으로도 플랫폼이 일반 마켓플레이스와 다른 점을 설명할 수 있어야 함
- 상태 머신의 흐름이 시각적으로 명확해야 함
- 타이머의 중요성이 드러나야 함
- ISSUE가 오버레이임이 명확해야 함

---

# 03 — State Components & Actions

## 목적 (Why this file exists)
각 상태(CREATED, FUNDED, DELIVERED, INSPECTION, APPROVED, ISSUE, SETTLED)에서 
어떤 액션이 허용되고 금지되는지 표준화하여,
디자이너와 개발자 간의 논쟁 없이 "어떤 버튼이 어떤 상태에 존재하는지"를 명확히 합니다.

## Required Frames

각 Canonical State에 대한 State Card Spec:

### 1. CREATED State Card
- **Header**: `CREATED / 거래 생성됨` (이중 레이블) + "거래가 생성되었습니다" (설명, 현지화 가능)
- **Timer slot**: 없음
- **Allowed actions**:
  - Buyer: Fund deal (현지화 가능)
  - Seller: (없음)
- **Forbidden actions**: Deliver, Approve, Raise issue (현지화 가능)
- **Evidence slot**: 없음

### 2. FUNDED State Card
- **Header**: "FUNDED" + "자금이 에스크로에 보관되었습니다"
- **Timer slot**: 없음
- **Allowed actions**:
  - Seller: Mark delivered
  - Buyer: (없음)
- **Forbidden actions**: Approve, Raise issue
- **Evidence slot**: 없음

### 3. DELIVERED State Card
- **Header**: "DELIVERED" + "배송이 완료되었습니다"
- **Timer slot**: 없음 (INSPECTION으로 즉시 전환)
- **Allowed actions**:
  - Seller: Upload evidence (optional)
  - System: Transition to INSPECTION
- **Forbidden actions**: Approve, Raise issue (아직 INSPECTION 전)
- **Evidence slot**: Seller evidence (optional)

### 4. INSPECTION State Card
- **Header**: `INSPECTION / 검수 중` (이중 레이블) + "구매자가 검수 중입니다" (설명, 현지화 가능)
- **Timer slot**: `AUTO_APPROVE / 자동 승인` timer (필수 표시, 이중 레이블)
  - Countdown + "구매자가 응답하지 않으면 자동 승인됩니다" (현지화 가능)
- **Allowed actions**:
  - Buyer: Approve / Raise issue (현지화 가능)
- **Forbidden actions**: Seller actions (대기, 현지화 가능)
- **Evidence slot**: 없음 (ISSUE 발생 시 필요)

### 5. APPROVED State Card
- **Header**: "APPROVED" + "구매자가 승인했습니다"
- **Timer slot**: HOLDBACK_RELEASE condition (필수 표시)
  - "Holdback이 자동으로 해제됩니다"
- **Allowed actions**:
  - System: Release holdback → SETTLED
- **Forbidden actions**: Buyer/Seller actions (정산 진행 중)
- **Evidence slot**: 없음

### 6. ISSUE State Card
- **Header**: `ISSUE / 문제 제기` (이중 레이블) + "문제가 제기되었습니다" (설명, 현지화 가능)
- **Timer slot**: `DISPUTE_TTL / 분쟁 TTL` timer (필수 표시, 이중 레이블)
  - Countdown + "TTL 만료 시 기본 해결책이 적용됩니다" (현지화 가능)
- **Allowed actions**:
  - Buyer: Upload evidence (필수, 현지화 가능)
  - Admin: Resolve dispute (constrained outcomes, 현지화 가능)
- **Forbidden actions**: Seller actions (대기, 현지화 가능)
- **Evidence slot**: Evidence required (필수)
  - Reason code 표시 (이중 레이블: `NOT_DELIVERED / 미배송` 등)
  - Evidence upload CTA (현지화 가능)

### 7. SETTLED State Card
- **Header**: "SETTLED" + "거래가 완료되었습니다"
- **Timer slot**: 없음 (터미널 상태)
- **Allowed actions**: 없음 (읽기 전용)
- **Forbidden actions**: 모든 액션 금지
- **Evidence slot**: 읽기 전용 (히스토리)

## Required Components

### 1. State Card Component
- Header (이중 레이블: Canonical Key + Localized Label + definition)
- Timer slot (optional, conditional, 이중 레이블 형식)
- Actions panel (role-based, 현지화 가능)
- Forbidden actions indicator (grayed out, 현지화 가능)
- Evidence slot (conditional)

### 2. Role-Based Action Matrix Component
- **Buyer Actions**:
  - INSPECTION: Approve button / Raise issue button
  - ISSUE: Upload evidence button / View resolution timeline
- **Seller Actions**:
  - FUNDED: Prepare delivery (Mark delivered)
  - DELIVERED: Upload evidence (optional)
  - APPROVED: View holdback release conditions (read-only)
- **System Actions** (표시만):
  - Auto-approve (INSPECTION)
  - TTL enforcement (ISSUE)
  - Holdback release (APPROVED)

## Do-Not-Break Rules
1. **상태별 액션 고정**: 각 상태에서 허용된 액션만 표시
2. **금지 액션 명시**: Forbidden actions를 명확히 표시 (grayed out)
3. **역할 기반 액션**: Buyer/Seller/Admin에 따라 다른 액션 표시
4. **타이머 필수 표시**: INSPECTION (AUTO_APPROVE), ISSUE (DISPUTE_TTL), APPROVED (HOLDBACK_RELEASE)에서 타이머 표시
5. **증빙 필수 표시**: ISSUE 상태에서 Evidence required 명확히 표시

## Done Criteria
- 디자이너와 개발자가 "어떤 버튼이 어떤 상태에 존재하는지" 논쟁 없이 결정할 수 있어야 함
- 각 상태의 State Card가 명확하게 정의되어야 함
- 역할 기반 액션 매트릭스가 완전해야 함
- 금지된 액션이 시각적으로 구분되어야 함

---

# 04 — Evidence + Money Panels

## 목적 (Why this file exists)
증빙과 금전 흐름을 투명하고 신뢰할 수 있게 시각화하여,
사용자가 "돈이 어디에 있고 다음에 무엇이 일어나야 하는지"를 명확히 알 수 있도록 합니다.

## Required Frames

### 1. Evidence Panel (Buyer/Seller)
- **Evidence slots**:
  - Photo slot (이미지 업로드)
  - Video slot (비디오 업로드)
  - Report slot (문서 업로드)
- **Upload CTA**: "Upload Evidence" 버튼
- **Evidence requirement banner**: 
  - ISSUE 상태일 때 "Evidence is required for issue creation" 배너 표시
  - Template에서 면제된 경우만 표시하지 않음
- **Evidence list**: 
  - 업로드된 증빙 목록
  - Timestamp 표시
  - Uploader 표시 (buyer/seller)
  - Type 표시 (photo/video/report)

### 2. Money Summary Panel
- **Total amount**: 전체 거래 금액
- **Immediate amount**: 즉시 금액 (기본 70%)
  - 설명: "이 금액은 DELIVERED 시점에 판매자에게 해제됩니다"
- **Holdback amount**: 보류 금액 (기본 30%)
  - 설명: "이 금액은 APPROVED 시점에 해제됩니다"
- **Release condition summary**: 규칙 기반 해제 조건 요약
  - "Holdback releases when APPROVED or auto-approve"
- **Next scheduled action**: 다음 예정된 액션 표시
  - 예: "Holdback releases when APPROVED or auto-approve"
  - 예: "Immediate amount releases at DELIVERED"

### 3. Ledger View (Read-Only)
- **Append-only entries list**:
  - HOLD entries (에스크로 보관)
  - RELEASE entries (해제)
  - REFUND entries (환불)
  - OFFSET entries (상계)
- **각 엔트리 표시**:
  - Type (HOLD/RELEASE/REFUND/OFFSET)
  - Amount
  - From account → To account
  - Reference ID (audit link)
  - Timestamp
  - Created by (system/admin)

## Required Components

### 1. Evidence Panel Component
- Evidence slots (photo/video/report)
- Upload CTA
- Evidence requirement banner (conditional)
- Evidence list with metadata

### 2. Money Summary Component
- Total/Immediate/Holdback amounts
- Release condition summary
- Next scheduled action indicator

### 3. Ledger Entry Component
- Entry type badge (이중 레이블: `HOLD / 보관`, `RELEASE / 해제`, `REFUND / 환불`, `OFFSET / 상계`)
- Amount display
- Account flow (from → to, 현지화 가능)
- Reference ID link
- Timestamp
- Created by indicator (현지화 가능)

## Do-Not-Break Rules
1. **Full freeze 금지**: Template에서 명시적으로 허용하지 않는 한 "전액 동결" 표시 금지
2. **법적 약속 금지**: Money panel은 법적 약속을 암시하지 않고, 규칙 결과와 조건만 설명
3. **Ledger append-only**: Ledger는 읽기 전용이며, 수정 불가
4. **Evidence 필수 표시**: ISSUE 상태에서 Evidence required 명확히 표시
5. **금액 정확성**: Immediate (70%) + Holdback (30%) = Total (100%) 정확히 표시

## Done Criteria
- 사용자가 "돈이 어디에 있고 다음에 무엇이 일어나야 하는지" 명확히 알 수 있어야 함
- Evidence 업로드 요구사항이 명확해야 함
- Ledger의 투명성이 드러나야 함
- Full freeze가 암시되지 않아야 함

---

# 05 — Admin / Dispute UI + Do-Not-Break Rules

## 목적 (Why this file exists)
관리자가 판사가 아닌 운영자임을 시각적으로 강제하여,
규칙에서 허용된 결과만 선택할 수 있도록 제한하고,
"숨겨진 정산"이나 "무한 동결"을 만들 수 없도록 합니다.

## Required Frames

### 1. Dispute List (Ops)
- **Columns**:
  - Deal ID (링크)
  - Category (이중 레이블: `CAR / 자동차`, `REAL_ESTATE_RENTAL / 부동산 임대` 등)
  - Status (이중 레이블: `ISSUE / 문제 제기`, `DISPUTE_OPEN / 분쟁 진행 중`)
  - Time remaining (TTL countdown, `DISPUTE_TTL / 분쟁 TTL` 표시)
  - Severity (Reason code 기반, 이중 레이블: `NOT_DELIVERED / 미배송`, `DAMAGE_MAJOR / 심각한 손상` 등)
- **Sorting**: TTL ascending (SLA 우선, 가장 긴급한 것부터)
- **Filters**: Status, Category, Severity

### 2. Dispute Detail (Ops)
- **Full timeline**: Audit events + key events 표시
  - State transitions
  - Rules evaluation outputs
  - Ledger actions executed
  - Dispute lifecycle (open/update/resolve)
- **Evidence panel**: Evidence metadata 링크
  - Photo/video/report 링크
  - Uploader 정보
  - Timestamp
- **Allowed resolutions**: Dropdown (constrained)
  - Template/rules에서 허용된 결과만 표시
  - 이중 레이블 형식: `releaseHoldbackMinusMinorCap / 보류 해제(소액 상계)` (Canonical Key / Localized Label)
  - 예: "releaseHoldbackMinusMinorCap" (canonical key)
  - 예: "fullRefund" (template에서 허용된 경우만, canonical key)
- **Confirmation modal**:
  - Selected outcome 표시
  - Resulting ledger actions summary (미리보기)
  - Required audit reason (필수 입력)
  - "This action will be logged" 경고

### 3. Do-Not-Break Rules (Poster Frame)
- **No timer hiding**: 타이머 숨기기 금지
- **No pause**: 일시정지 기능 금지
- **No manual settle without logs**: 로그 없이 수동 정산 금지
- **Dispute must have TTL**: 모든 분쟁은 TTL 필수
- **Evidence required for issue**: ISSUE 생성 시 증빙 필수
- **Admin can only choose allowed outcomes**: 관리자는 허용된 결과만 선택 가능

## Required Components

### 1. Dispute List Component
- Table with columns (Deal ID, Category, Status, TTL, Severity)
- TTL countdown indicator
- Severity badge (reason code 기반)
- Sort by TTL ascending

### 2. Dispute Detail Component
- Full timeline view
- Evidence panel
- Allowed resolutions dropdown (constrained)
- Confirmation modal

### 3. Admin Override Component (rare cases)
- Override reason selector (enum)
- Free text explanation (필수)
- Evidence reference (optional)
- "This will be logged as ADMIN_OVERRIDE" 경고

## Do-Not-Break Rules
1. **Constrained resolutions**: Admin은 규칙에서 허용된 결과만 선택 가능 (자유 입력 금지)
2. **Canonical Key 유지**: 모든 드롭다운 옵션에 canonical key 표시 (예: `releaseHoldbackMinusMinorCap`)
3. **TTL 항상 표시**: Dispute TTL을 항상 표시하고, 만료 시 기본 해결책 적용 명시 (`DISPUTE_TTL / 분쟁 TTL`)
4. **Audit 필수**: 모든 Admin 액션은 AuditEvent 생성 (ADMIN_OVERRIDE 포함)
5. **Manual settle 금지**: "수동 정산" 버튼은 Audit 없이 사용 불가
6. **Full freeze 금지**: Template에서 명시적으로 허용하지 않는 한 "전액 동결" 옵션 제공 금지
7. **Evidence 필수**: ISSUE 생성 시 증빙 필수 (template에서 면제된 경우만 예외)
8. **이중 레이블 필수**: 모든 상태/타이머/코드는 이중 레이블 형식 사용

## Done Criteria
- Admin UI를 사용하여 "숨겨진 정산"이나 "무한 동결"을 만들 수 없어야 함
- 모든 Admin 액션이 감사 가능해야 함
- 규칙에서 허용된 결과만 선택 가능해야 함
- TTL의 중요성이 드러나야 함
- Do-Not-Break Rules가 시각적으로 명확해야 함

---

# 전체 작업 체크리스트

## 공통 요구사항
- [ ] 모든 용어가 Cursor DevPack과 일치하는가? (Canonical Keys)
- [ ] 이중 레이블 형식이 일관되게 적용되었는가? (Canonical Key / Localized Label)
- [ ] 타이머가 항상 표시되는가? (이중 레이블 형식)
- [ ] 증빙 요구사항이 명확한가?
- [ ] 금전 상태가 투명한가?
- [ ] ISSUE가 오버레이로 표시되는가?
- [ ] Canonical Key가 번역되지 않았는가?

## 파일별 체크리스트
- [ ] 00: 핵심 원칙이 명확한가?
- [ ] 01: 4개 기둥이 모두 표현되었는가?
- [ ] 02: 타임라인이 명확한가?
- [ ] 03: 각 상태의 액션이 명확한가?
- [ ] 04: 증빙과 금전 패널이 투명한가?
- [ ] 05: Admin UI가 제약되어 있는가?

## 최종 검증
- [ ] 새로운 팀원이 모든 파일을 보고 플랫폼의 구조를 이해할 수 있는가?
- [ ] Cursor DevPack과의 일관성이 유지되는가?
- [ ] Do-Not-Break Rules가 모두 준수되는가?
