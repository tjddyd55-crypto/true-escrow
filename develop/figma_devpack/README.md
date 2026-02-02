# Figma DevPack — Trust & Escrow UI (SSOT)

이 폴더는 Trust & Escrow 엔진을 표현하기 위한 **UI SSOT (Single Source of Truth)**를 정의합니다.

## 파일 구조

- `00_FIGMA_SSOT_OVERVIEW.md`: 전체 구조와 원칙
- `01_INFORMATION_ARCHITECTURE_AND_NAV.md`: 정보 구조와 네비게이션
- `02_TRANSACTION_TIMELINE_UI.md`: 거래 타임라인 UI
- `03_STATE_COMPONENTS_AND_ACTIONS.md`: 상태 컴포넌트와 액션
- `04_EVIDENCE_AND_MONEY_PANELS.md`: 증빙 및 금전 패널
- `05_ADMIN_DISPUTE_UI_AND_RULES.md`: 관리자/분쟁 UI 및 규칙
- `FIGMA_WORK_INSTRUCTIONS.md`: **Figma 작업 지시서 (이 파일을 먼저 읽으세요)**
- `I18N_AND_LOCALIZATION_RULES.md`: **i18n 및 현지화 규칙 (필수 읽기)**

## 시작하기

1. **먼저 읽어야 할 문서**:
   - `I18N_AND_LOCALIZATION_RULES.md`: i18n 규칙 이해
   - `FIGMA_WORK_INSTRUCTIONS.md`: 작업 지시서

2. **Figma 파일 생성**:
   - Figma 프로젝트: "Trust & Escrow UI DevPack v1"
   - 6개 Figma 파일 생성 (00→05)
   - 각 파일에 지정된 프레임 생성

3. **작업 순서**:
   - 00 → 01 → 02 → 03 → 04 → 05 순서로 작업

## 핵심 원칙

1. **구조적 UI**: "예쁜 UI"가 아닌 "구조적 UI"
2. **Canonical Keys 유지**: 모든 상태/타이머/코드는 영어 canonical key 유지
3. **이중 레이블**: `[Canonical Key] / [Localized Label]` 형식 사용
4. **타이머 항상 표시**: AUTO_APPROVE, DISPUTE_TTL, HOLDBACK_RELEASE
5. **ISSUE는 오버레이**: 메인 플로우를 대체하지 않음
6. **증빙 필수**: ISSUE 생성 시 Evidence required

## 관련 문서

- Cursor DevPack: `../cursor_devpack/` (백엔드 SSOT)
- 이 문서는 UI SSOT를 정의합니다.

## 중요: i18n 규칙

**모든 Figma 작업은 `I18N_AND_LOCALIZATION_RULES.md`의 규칙을 준수해야 합니다.**

- Canonical keys는 절대 번역하지 않음
- UI 레이블만 현지화 가능
- 이중 레이블 형식 필수: `INSPECTION / 검수 중`
