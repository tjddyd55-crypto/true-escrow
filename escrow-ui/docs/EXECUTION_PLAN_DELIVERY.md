# 거래 실행 명세서 (Execution Plan) — 구현 산출물

## 1. 생성/수정된 파일 목록

### 신규
- `lib/execution-plan/types.ts` — ExecutionPlanDoc 타입
- `lib/execution-plan/buildExecutionPlanDoc.ts` — Graph → Doc 순수 변환
- `lib/execution-plan/renderExecutionPlanHtml.ts` — Doc → HTML 문자열 (인라인 CSS)
- `lib/execution-plan/renderExecutionPlanToPdf.ts` — Doc → PDF Buffer (pdfkit)
- `components/execution-plan/ExecutionPlanTimeline.tsx` — 수직 타임라인 UI
- `app/transaction/preview/[id]/page.tsx` — 미리보기 페이지
- `app/api/engine/transactions/[id]/execution-plan.pdf/route.ts` — PDF 다운로드 API

### 수정
- `lib/i18n/en.ts` — executionPlan.* 키 추가
- `lib/i18n/ko.ts` — executionPlan.* 키 추가
- `app/transaction/builder/[id]/page.tsx` — "미리보기" 버튼 추가
- `package.json` / `package-lock.json` — pdfkit 의존성 추가

---

## 2. Preview URL

- **미리보기:** `/transaction/preview/[id]`
- 예: `http://localhost:3000/transaction/preview/abc-123-uuid`

---

## 3. PDF 엔드포인트

- **URL:** `GET /api/engine/transactions/[id]/execution-plan.pdf`
- **응답:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="execution-plan-<id>.pdf"`
- 예: `GET http://localhost:3000/api/engine/transactions/abc-123-uuid/execution-plan.pdf`

---

## 4. 샘플 거래 id로 동작 확인 절차

1. **거래 생성**
   - `/transaction/new` 에서 템플릿(또는 빈 거래)으로 생성 후 Builder로 이동.
   - 또는 `POST /api/engine/transactions` 로 트랜잭션 생성 후 반환된 `data.id` 사용.

2. **미리보기**
   - Builder 화면에서 **"미리보기"** 버튼 클릭 → `/transaction/preview/[id]` 이동.
   - 거래 요약(제목/설명/기간/블록 수/당사자), 수직 타임라인(START → BLOCK들 → END), 블록별 기간/승인자/조건/지급 규칙, 경과 일수(갭), 하단 면책문구 확인.

3. **PDF 다운로드**
   - 미리보기 페이지에서 **"PDF 다운로드"** 클릭.
   - 또는 브라우저에서 `GET /api/engine/transactions/[id]/execution-plan.pdf` 직접 호출.
   - 파일명 `execution-plan-<id>.pdf`, 내용은 미리보기와 동일 + 면책문구 3줄 포함.

4. **날짜/블록 변경 후 재확인**
   - Builder에서 날짜 변경 또는 블록 추가/분할 후, 다시 미리보기 진입 → 최신 상태 반영(read-only, 저장 없음).

---

## 5. 원칙 준수

- **엔진 read-only:** Preview/PDF는 store를 변경하지 않음.
- **공통 DocumentModel:** ExecutionPlanDoc 하나로 Preview(React)와 PDF(pdfkit) 공유.
- **PDF 생성:** HTML 재사용 없이 Doc → pdfkit으로 직접 생성 (Railway 등에서 Chromium 불필요).
- **번역:** doc에는 title 등 문자열(또는 i18n 키) 보관, Preview에서 `tKey`로 번역 적용.
- **면책문구:** doc.disclaimerLines 3줄, PDF/Preview 하단 동일 노출.
