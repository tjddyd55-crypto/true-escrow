# Escrow Template System – Unified Spec (v0.1)

## 목적

- **템플릿은 초기 제안(Default)** 이다.
- **사용자는 수정 가능**하다.
- **엔진은 절대 규칙을 강제**한다.
- **UI에서 "수정 가능 / 수정 불가"가 명확히 보인다.**

---

## 1. 템플릿 개념 정의 (엔진 관점 고정)

**템플릿 = 2가지 레이어**

| 레이어 | 설명 |
|--------|------|
| **Template** | **Defaults** (수정 가능) + **Constraints** (수정 불가) |
| **Defaults** | 사용자에게 처음 채워서 보여주는 값. 대부분 수정 가능. |
| **Constraints** | 에스크로 엔진의 안전 규칙. 사용자·관리자 모두 수정 불가. |

---

## 2. 템플릿 공통 JSON 구조 (엔진 기준)

```json
{
  "template_id": "QUICK_DELIVERY",
  "label": "택배 / 중고 거래",
  "defaults": {
    "title": "중고 물품 택배 거래",
    "description": "물품 수령 후 대금이 지급됩니다.",
    "blocks": [
      {
        "block_id": "PAYMENT",
        "title": "결제",
        "description": "구매자가 결제를 완료합니다.",
        "amount_type": "FULL",
        "approver": "buyer",
        "auto_approve": true
      },
      {
        "block_id": "RECEIVE",
        "title": "수령 확인",
        "description": "구매자가 물품 수령을 확인합니다.",
        "amount_type": "FULL",
        "approver": "buyer",
        "auto_approve": false,
        "timeout": "24h"
      }
    ]
  },
  "constraints": {
    "min_blocks": 2,
    "sequence_enforced": true,
    "approval_required": true,
    "payout_only_after_approval": true,
    "blockchain_record_on_approval": true
  }
}
```

---

## 3. 템플릿별 "초기안" 정의

### A. 택배 / 중고 거래 템플릿

**의도**

- 가장 단순.
- 엔진 기본 동작 검증용.

**초기 제안**

- 블록: 2개.
- 자동 승인: 수령 후 타임아웃 가능.
- 승인 주체: 구매자.

**사용자 안내 문구**

> "일반적인 택배/중고 거래에 적합한 구조입니다. 필요 시 조건과 내용을 수정할 수 있습니다."

---

### B. 이사 거래 템플릿

```json
{
  "template_id": "MOVING_SERVICE",
  "label": "이사 거래",
  "defaults": {
    "title": "이사 서비스 거래",
    "description": "이사 완료 확인 후 잔금이 지급됩니다.",
    "blocks": [
      {
        "block_id": "DEPOSIT",
        "title": "계약금",
        "amount_ratio": 0.2,
        "approver": "buyer"
      },
      {
        "block_id": "START",
        "title": "이사 시작",
        "approver": "buyer"
      },
      {
        "block_id": "COMPLETE",
        "title": "이사 완료",
        "approver": "buyer"
      },
      {
        "block_id": "FINAL",
        "title": "잔금 지급",
        "amount_ratio": 0.8,
        "auto_approve": true
      }
    ],
    "calendar_required": true
  },
  "constraints": {
    "min_blocks": 3,
    "sequence_enforced": true,
    "date_required": true
  }
}
```

---

## 4. 템플릿 수정: 허용 / 비허용 필드 (핵심)

### ✅ 사용자가 수정 가능한 항목 (Editable)

| 항목 | 설명 |
|------|------|
| 거래 제목 | 자유 수정 |
| 거래 설명 | 자유 수정 |
| 블록 제목 | 자유 수정 |
| 블록 설명 | 자유 수정 |
| 블록 금액 / 비율 | 범위 내 수정 |
| 자동 승인 시간 | on/off, 시간 변경 |
| 날짜(있는 경우) | 변경 가능 |
| 조건 문구 | 자유 수정 |

### ❌ 사용자가 수정 불가능한 항목 (Locked)

| 항목 | 이유 |
|------|------|
| 블록 순서 | 에스크로 무결성 |
| 블록 삭제(필수 블록) | 엔진 규칙 |
| 승인 흐름 자체 | 분쟁 방지 |
| 지급 트리거 조건 | 금융 사고 방지 |
| 블록체인 기록 조건 | 증명 무결성 |

---

## 5. UX에서 "수정 가능 / 불가능"을 보여주는 방법

### 🎨 UI 표현 규칙 (강력 추천)

#### 🔓 수정 가능 필드

- 기본 텍스트 입력.
- 연필 아이콘 ✏️.
- 회색 안내문: *"거래 상황에 맞게 수정할 수 있습니다."*

#### 🔒 수정 불가 필드

- 자물쇠 아이콘 🔒.
- 회색 배경 + 비활성 스타일.
- hover 시 설명 표시:  
  **🔒 이 항목은 에스크로 안전 규칙에 따라 수정할 수 없습니다.**

#### 📌 블록 카드 상단 배지

- **DEFAULT** (초기 제안)
- **LOCKED** (엔진 고정)

---

## 6. 테스트할 때 이 구조가 좋은 이유

- **QA 시:** "이게 왜 안 바뀌지?" → UI에서 바로 이유 확인.
- **사용자 시:** "내가 뭘 바꿀 수 있는지" 명확.
- **개발 시:** 수정 불가 항목은 프론트 + 백엔드 이중 방어.

---

## 7. 엔진 Validation Rule (개발자용 고정 체크)

엔진은 항상 아래를 검사해야 함:

- 블록 순서 위반 ❌
- 승인 없는 다음 블록 진입 ❌
- 승인 중복 ❌
- 블록체인 기록 없는 지급 ❌
- **수정 불가 필드 변경 요청** ❌

---

## 8. 이 문서의 역할 정리

| 용도 | 설명 |
|------|------|
| ✔ 템플릿 설계 문서 | Defaults + Constraints 정의 |
| ✔ QA 기준 문서 | Editable vs Locked 검증 |
| ✔ UX 가이드 | 🔓/🔒, 배지, 안내 문구 |
| ✔ 엔진 Validation 기준 | 백엔드 검증 규칙 |
| ✔ 나중에 API 문서의 뿌리 | 공통 JSON 구조 및 필드 의미 |

---

## 9. 현재 코드베이스와의 매핑 (참고)

- **엔진/UI:** `escrow-ui/lib/transaction-engine/templates.ts`, `escrow-ui/app/api/engine/templates/route.ts`, Builder `escrow-ui/app/transaction/builder/[id]/page.tsx`.
- **기존 템플릿:** `TransactionGraph` 형태 (transaction, blocks, approvalPolicies, blockApprovers, workRules, workItems). 본 스펙의 `defaults` + `constraints` 구조로 확장/매핑 시 이 문서를 SSOT로 사용.
