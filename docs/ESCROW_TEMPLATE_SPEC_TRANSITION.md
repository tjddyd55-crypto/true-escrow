# Escrow Template → Engine 정석 구조 전환

## 질문에 대한 답

**지금 엔진에서 TransactionGraph를 직접 defaults로 받도록 설계되어 있어?**

→ **예.** 이번 수정 전까지는 DB `defaults`를 **TransactionGraph 형태**로 저장하고, POST 시 `row.defaults as TransactionGraph`로 파싱한 뒤 ID만 갈아끼워 `saveTransactionGraph` 호출하는 구조였음.

**이번에 spec 기반으로 전환했어?**

→ **예.** 이번 전환으로 아래가 적용됨.

- **TemplateSpec** (순수 거래 스펙) 타입 + Zod 검증
- **buildTransactionFromTemplateSpec(spec, params)** 로 스펙 → TransactionGraph 생성
- API: `defaults`를 TemplateSpec으로 파싱, 실패 시 `"TemplateSpec validation failed"`, 성공 시 builder 호출 후 `saveTransactionGraph`
- DB: defaults를 TemplateSpec 구조로 통일 (001 시드 수정, 003 마이그레이션)

---

## 적용된 구조

| 레이어 | 역할 |
|--------|------|
| **DB** | `defaults` = TemplateSpec (blocks[].sequence, title_key, amount, approval) |
| **API** | Zod 검증 → buildTransactionFromTemplateSpec → saveTransactionGraph |
| **엔진** | TransactionGraph만 다룸 (스펙 모름) |

---

## 마이그레이션

- **001**: QUICK_DELIVERY 시드를 TemplateSpec 형태로 변경 (신규 설치용).
- **003**: 기존 QUICK_DELIVERY / MOVING_SERVICE 행의 `defaults`를 TemplateSpec으로 UPDATE.

운영 DB에는 **003** 실행 필요.
