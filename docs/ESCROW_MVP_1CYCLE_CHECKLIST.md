# Escrow MVP 1사이클 안정화 검증 체크리스트

템플릿 생성 → 블록 수정/날짜 변경 → 승인 흐름 → 미리보기 → PDF 다운로드 전 구간이 **데이터 중복/누적/캐시/언어 깨짐/렌더 오류 없이** 완주되는지 점검용.

---

## 1. Graph ↔ ExecutionPlanDoc 정합성

- [ ] **Doc 생성은 read-only**  
  `buildExecutionPlanDoc` 내부에 `store.save`, `store.update`, `push`(store용), `filter+concat`(store용) 없음.
- [ ] **블록 정렬은 sequence(orderIndex) 기준**  
  ID 순서에 의존하지 않음. (`[...graph.blocks].sort((a,b) => a.orderIndex - b.orderIndex)` 등)
- [ ] **동일 거래 10회 Preview 호출**  
  서버 로그에 데이터 변경 흔적 없음, `workRules` 수 증가 없음.

---

## 2. 블록 추가/수정 안정성

- [ ] **블록 추가 시 sequence = max(sequence)+1**  
  API에서 `orderIndex` 미지정 시 `max(existingBlocks.orderIndex) + 1` 사용. (`app/api/engine/blocks/route.ts`)
- [ ] **날짜 변경 시 addBlock 호출 없음**  
  날짜 변경 로직에서 블록 생성/삭제 금지.
- [ ] **useEffect 내 addBlock 없음**  
  블록 추가는 **명시적 버튼 이벤트**에서만.

---

## 3. Preview ↔ Builder 상태 분리

- [ ] **Preview는 read-only**  
  Preview 컴포넌트에 서버 상태를 변경하는 `onClick`/`setState` 없음.
- [ ] **Preview는 GET만**  
  PATCH 등 변경 API 호출 없음. GET + 로컬 UI 상태만.

---

## 4. PDF 서버 안전성

- [ ] **폰트 없을 때 500 없음**  
  NotoSansKR 없으면 경고 로그만 남기고 Helvetica로 정상 PDF 반환.
- [ ] **메모리/스트림 처리**  
  `pdf.end()` 호출, `pdf.on("end", ...)`에서 버퍼 수집 후 resolve, 누적/누수 없음.

---

## 5. 승인 흐름과 ExecutionPlan 일치성

- [ ] **승인 role = blockApprovers**  
  Doc/Preview에 표시되는 승인 역할이 엔진의 `blockApprovers`와 동일.
- [ ] **지급 규칙 = amount.type/value**  
  RATIO → % 변환 정확, FIXED → 금액 포맷팅 locale 안전(예: `toLocaleString('ko-KR'|'en-US')`).

---

## 6. S3

- [ ] **현재 단계에서는 S3 미사용**  
  PDF on-demand 생성, 저장/서명/외부 공유 없음. S3는 PDF 보관·계약서 첨부·분쟁 증빙·파일 업로드 등 다음 단계에서만 도입.

---

*마지막 갱신: 1사이클 안정화 마감 지시문 반영*
