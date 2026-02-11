# Escrow Engine 저장 정책 (Save Policy)

## 원칙: 불변 Graph + Replace 저장

- **생성**: TemplateSpec 기반 빌드는 **오직 최초 생성(POST)** 시에만 사용. `buildTransactionFromTemplateSpec` → `saveTransactionGraph` (replace).
- **수정**: **재빌드 금지**. 기존 graph 로드 → 필요한 필드만 mutate (clone 후 수정) → `saveTransactionGraph` (replace).
- **배열**: 기존 배열에 `push`/`concat`으로 append 하지 않음. 해당 트랜잭션(그래프) 소속 엔티티는 **제거 후 그래프 배열로 완전 교체**.

## 작업별 방식

| 작업       | 방식 |
|-----------|------|
| 생성       | build (TemplateSpec 또는 빈 그래프) → **replace 저장** |
| 수정(PATCH)| load → mutate (clone 후) → **replace 저장** |
| 재빌드     | **절대 금지** (수정 API에서 TemplateSpec 호출 금지) |
| 배열 업데이트 | 기존 그래프 소속 제거 후 재할당 (replace only) |

## Idempotency

- `saveTransactionGraph` 호출 전에 그래프 내부 배열의 **중복 id** 검사.
- blocks, approvalPolicies, blockApprovers, workRules, workItems 각각에 대해 `Set(id).size === length` 여부 확인, 실패 시 예외.

## 구현 요약

- `saveTransactionGraph(graph)`:  
  - 해당 `graph.transaction.id`에 속한 blocks / approvalPolicies / blockApprovers / workRules / workItems를 전역 배열에서 **제거**한 뒤, `graph`의 배열로 **교체** (filter-out + concat).
- PATCH `/api/engine/transactions/[id]`:  
  - `buildTransactionFromTemplateSpec` 호출 없음.  
  - `getTransaction` + `getBlocks` 등으로 현재 그래프 구성 후, `transaction`만 `structuredClone`하여 날짜 등 필드 수정, `saveTransactionGraph`로 replace 저장.

## 지시문 체크리스트 검증

| # | 항목 | 상태 |
|---|------|------|
| 1 | TemplateSpec 재빌드: POST 생성 API에서만 사용, PATCH/날짜·정책·승인자 변경 경로 미사용 | ✅ |
| 2 | saveTransactionGraph: replace only (filter-out 해당 그래프 소속 후 concat), append/merge 없음 | ✅ |
| 3 | graph.blocks/workRules/approvers/policies/workItems: 저장 시 누적 없이 교체만 | ✅ |
| 4 | PATCH: TemplateSpec 미호출, 배열 재생성 후 append 없음, 날짜 변경 시 workRules 재생성 없음 | ✅ |
| 5 | save 직전 idempotency: blocks, approvalPolicies, blockApprovers, workRules, workItems 중복 id 검사 후 throw | ✅ |
| 6 | 생성: 새 UUID·새 배열만. 수정: structuredClone 후 수정 → replace 저장 | ✅ |
| 7 | 위험 패턴: save 경로는 filter+concat만, 단일 추가(addBlock/addWorkRule 등)만 push 사용 | ✅ |
| 8 | 저장 정책 명문화: 본 문서 | ✅ |
| 9 | 테스트: 템플릿 2 workRules → 날짜 변경 10회 → workRules 2개 유지. 빌드 시 test 선행 | ✅ |
