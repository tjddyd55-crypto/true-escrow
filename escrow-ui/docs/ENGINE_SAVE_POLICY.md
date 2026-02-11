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
