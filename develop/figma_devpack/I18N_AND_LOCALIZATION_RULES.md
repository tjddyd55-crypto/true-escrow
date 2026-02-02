# i18n 및 현지화 규칙 (i18n and Localization Rules)

**Date**: 2026-01-31  
**Status**: Non-negotiable guardrails

## 핵심 원칙 (Core Principles)

이 프로젝트는 **글로벌 우선(global-first)** 설계를 따릅니다.
미래의 다국어 지원을 전제로 하되, 구조적 변경 없이 확장 가능해야 합니다.

---

## 1. Canonical Keys는 절대 변경 불가

### 규칙
**Canonical keys는 코드와 SSOT에서 항상 영어로 유지됩니다.**
번역, 이름 변경, 대체가 금지됩니다.

### 적용 대상
- **DealState**: `CREATED`, `FUNDED`, `DELIVERED`, `INSPECTION`, `APPROVED`, `ISSUE`, `SETTLED`
- **Timer Keys**: `AUTO_APPROVE`, `DISPUTE_TTL`, `HOLDBACK_RELEASE`
- **IssueReasonCode**: `NOT_DELIVERED`, `DAMAGE_MAJOR`, `DAMAGE_MINOR`, `MISSING_PARTS`, `QUALITY_NOT_MATCHING`, `DOCUMENT_MISMATCH`, `OTHER`
- **LedgerEntryType**: `HOLD`, `RELEASE`, `REFUND`, `OFFSET`
- **DealCategory**: `CAR`, `REAL_ESTATE_RENTAL`, `REAL_ESTATE_SALE`, `HIGH_VALUE_USED`, `B2B_DELIVERY`
- **Role**: `BUYER`, `SELLER`, `OPERATOR`, `INSPECTOR`

### 금지 사항
- ❌ `CREATED` → `생성됨` (코드에서)
- ❌ `AUTO_APPROVE` → `자동승인` (코드에서)
- ❌ `NOT_DELIVERED` → `미배송` (코드에서)
- ❌ API 응답에서 canonical key를 번역
- ❌ 데이터베이스에서 canonical key를 번역

### 허용 사항
- ✅ UI 레이블만 현지화 (한국어, 영어 등)
- ✅ 사용자에게 보이는 텍스트만 번역
- ✅ Figma에서 이중 레이블 형식 사용

---

## 2. UI 레이블 현지화

### 규칙
**UI 레이블은 현지화 가능하지만, canonical keys는 절대 번역/변경 불가**

### 예시

#### 올바른 방식
```json
{
  "state": "INSPECTION",  // canonical key (영어 유지)
  "stateLabel": {
    "ko": "검수 중",
    "en": "Under Inspection"
  }
}
```

#### 잘못된 방식
```json
{
  "state": "검수중",  // ❌ canonical key를 번역
  "stateLabel": "Under Inspection"
}
```

---

## 3. Figma 이중 레이블 형식

### 규칙
**Figma에서는 canonical key와 localized label을 모두 표시합니다.**

### 형식
```
[Canonical Key] / [Localized Label]
```

### 예시
- `INSPECTION / 검수 중`
- `AUTO_APPROVE / 자동 승인`
- `NOT_DELIVERED / 미배송`
- `HOLD / 보관`

### 구현 가이드
1. **Canonical key는 항상 표시**: 사용자가 보는 UI에도 canonical key가 보이거나, 최소한 개발자 도구에서 확인 가능해야 함
2. **Localized label은 가독성용**: 사용자에게 친숙한 언어로 표시
3. **Figma 컴포넌트 구조**:
   - Primary label: Localized label (큰 글씨)
   - Secondary label: Canonical key (작은 글씨, 회색)

---

## 4. 백엔드 로직에서 언어 문자열 하드코딩 금지

### 규칙
**언어 처리는 presentation layer의 책임입니다.**

### 금지 사항
- ❌ 백엔드 코드에 한국어 문자열 하드코딩
- ❌ 비즈니스 로직에서 언어별 분기 처리
- ❌ API 응답에 하드코딩된 언어 문자열 포함

### 올바른 방식
```java
// ✅ 올바른 방식: canonical key만 반환
public DealResponse getDeal(UUID id) {
    Deal deal = dealRepository.findById(id);
    return DealResponse.builder()
        .state(deal.getState().name())  // "INSPECTION" (canonical key)
        .build();
}

// ❌ 잘못된 방식: 언어 문자열 하드코딩
public DealResponse getDeal(UUID id) {
    Deal deal = dealRepository.findById(id);
    String stateLabel = switch(deal.getState()) {
        case INSPECTION -> "검수 중";  // ❌ 하드코딩
        // ...
    };
    return DealResponse.builder()
        .stateLabel(stateLabel)
        .build();
}
```

### 프론트엔드 책임
프론트엔드는 canonical key를 받아서 적절한 언어로 번역합니다:
```typescript
const stateLabels = {
  ko: {
    INSPECTION: "검수 중",
    APPROVED: "승인됨",
    // ...
  },
  en: {
    INSPECTION: "Under Inspection",
    APPROVED: "Approved",
    // ...
  }
};

// 사용
const displayLabel = stateLabels[locale][deal.state]; // "INSPECTION" → "검수 중"
```

---

## 5. 글로벌 우선 설계 (Global-First)

### 원칙
**미래의 다국어 지원을 전제로 하되, 구조적 변경 없이 확장 가능해야 합니다.**

### 설계 고려사항
1. **Canonical keys는 언어 독립적**: 어떤 언어를 추가해도 코드 변경 불필요
2. **i18n은 레이어 분리**: Presentation layer에서만 처리
3. **데이터베이스 스키마**: 언어별 컬럼 추가 없이, 별도 번역 테이블 또는 JSON 필드 사용
4. **API 설계**: Canonical key만 반환, 클라이언트가 번역

### 확장 시나리오
```
현재: 한국어 UI
미래: 한국어 + 영어 + 일본어 + 중국어
```

**구조 변경 없이 확장 가능**:
- 백엔드: 변경 없음 (canonical keys 유지)
- 프론트엔드: 번역 파일만 추가
- 데이터베이스: 변경 없음

---

## 6. Figma 작업 시 적용 규칙

### 컴포넌트 명명
- **Canonical key 사용**: `StateCard_INSPECTION`, `Timer_AUTO_APPROVE`
- **Localized label은 표시용**: 컴포넌트 내부에 표시

### 레이블 표시 형식
```
[Localized Label]
(Canonical Key)
```

또는

```
Localized Label / Canonical Key
```

### 예시: State Card
```
┌─────────────────────┐
│ 검수 중              │  ← Localized label (큰 글씨)
│ (INSPECTION)        │  ← Canonical key (작은 글씨, 회색)
│                     │
│ [자동 승인 타이머]    │
│ (AUTO_APPROVE)      │
└─────────────────────┘
```

---

## 7. 검증 체크리스트

### 코드 검증
- [ ] 모든 enum 값이 영어로 정의되어 있는가?
- [ ] API 응답에 canonical key가 포함되어 있는가?
- [ ] 백엔드 코드에 하드코딩된 언어 문자열이 없는가?
- [ ] 데이터베이스에 canonical key가 저장되는가?

### Figma 검증
- [ ] 모든 컴포넌트에 canonical key가 표시되어 있는가?
- [ ] 이중 레이블 형식이 일관되게 적용되어 있는가?
- [ ] Localized label만 보고도 의미를 이해할 수 있는가?

### 문서 검증
- [ ] SSOT 문서에 canonical keys가 명시되어 있는가?
- [ ] 번역 가이드가 별도로 존재하는가?
- [ ] 개발자가 canonical key와 localized label을 구분할 수 있는가?

---

## 8. 예외 및 특수 케이스

### 사용자 입력
- 사용자가 입력하는 **자유 텍스트**는 현지화 대상이 아님
- 예: ISSUE의 `freeText` 필드 (reasonCode가 `OTHER`일 때)

### 에러 메시지
- 에러 메시지는 presentation layer에서 처리
- 백엔드는 에러 코드만 반환 (예: `ERROR_DEAL_NOT_FOUND`)
- 프론트엔드가 에러 코드를 적절한 언어로 번역

### 로그 및 감사
- AuditEvent의 `payload`는 JSON 문자열 (canonical keys 포함)
- 로그 메시지는 개발자용이므로 영어 권장 (선택사항)

---

## 9. 마이그레이션 가이드 (향후)

### 기존 코드가 규칙을 위반하는 경우
1. **Canonical key 추출**: 하드코딩된 문자열을 enum/constant로 추출
2. **레이어 분리**: 언어 처리를 presentation layer로 이동
3. **점진적 마이그레이션**: 한 번에 모든 것을 변경하지 않고 단계적으로

### 예시 마이그레이션
```java
// Before (❌)
if (state.equals("검수 중")) { ... }

// After (✅)
if (state == DealState.INSPECTION) { ... }
```

---

## 10. 참고 자료

- Cursor DevPack: `develop/cursor_devpack/02_DOMAIN_MODEL_AND_GLOSSARY.md`
- Figma DevPack: `develop/figma_devpack/00_FIGMA_SSOT_OVERVIEW.md`
- API Contracts: `develop/cursor_devpack/07_API_CONTRACTS.md`

---

## 요약

1. ✅ **Canonical keys는 항상 영어, 절대 변경 불가**
2. ✅ **UI 레이블만 현지화 가능**
3. ✅ **Figma는 이중 레이블 형식 사용**
4. ✅ **백엔드에 언어 문자열 하드코딩 금지**
5. ✅ **글로벌 우선 설계로 미래 확장 가능**

**이 규칙은 non-negotiable입니다. 모든 구현과 디자인은 이 규칙을 준수해야 합니다.**
