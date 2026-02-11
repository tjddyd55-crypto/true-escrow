# 템플릿 API + 프론트 i18n 적용 지시문 (코드 미적용 환경용)

DB 마이그레이션은 완료된 상태에서, **API/프론트가 아직 구버전**일 때 적용할 수정.

---

## 1. API 수정

**파일:** `app/api/escrow/templates/route.ts`

- **기존:** `SELECT template_key, label, defaults`
- **변경:** `SELECT template_key, label_key, description_key, defaults`
- 응답 타입/필드도 `label` 대신 `label_key`, `description_key` 사용.

**최종 응답 예시:**
```json
{
  "ok": true,
  "data": [
    {
      "template_key": "QUICK_DELIVERY",
      "label_key": "template.quick_delivery.title",
      "description_key": "template.quick_delivery.description",
      "defaults": { ... }
    }
  ]
}
```

---

## 2. 프론트 수정

**파일:** `app/transaction/new/page.tsx`

- **기존:** `template.label`  
- **변경:** `t(template.label_key)` 또는 dot path를 지원하는 번역 함수 `tKey(template.label_key)` 사용.

- **기존:** `template.description` 또는 `template.defaults?.description`  
- **변경:** `t(template.description_key)` 또는 `tKey(template.description_key)` 사용.

(i18n이 dot path를 지원하지 않으면 `tKey` 같은 함수를 provider에 추가해 `template.quick_delivery.title` → 문자열로 변환.)

---

## 3. 성공 기준

- `/api/escrow/templates` 응답에 `label_key`, `description_key` 포함.
- 화면에 `template.label` 대신 **번역된 문구**가 표시됨 (EN/KO 전환 시 변경).

---

## 4. 참고 (이미 적용된 저장소)

`trust-escrow` 현재 코드는 위 수정이 이미 반영되어 있음. 다른 브랜치/배포 환경만 위 지시대로 맞추면 됨.
