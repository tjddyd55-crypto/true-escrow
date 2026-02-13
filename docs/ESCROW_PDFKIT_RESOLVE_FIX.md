# Module not found: Can't resolve 'pdfkit' — 원인 및 해결

## 에러 메시지

```
Module not found: Can't resolve 'pdfkit'
./lib/execution-plan/renderExecutionPlanToPdf.ts:11:1
import PDFDocument from "pdfkit";
```

---

## 원인은 두 가지 중 하나일 수 있음

### 1️⃣ dependency 위치 (production 설치 시 빠짐)

- **pdfkit이 `devDependencies`에 있는 경우**
- Railway 등에서 `npm install --omit=dev`(또는 `NODE_ENV=production npm install`) 사용 시 **devDependencies는 설치되지 않음**
- 결과: `node_modules`에 pdfkit이 없음 → 런타임/빌드 모두 "Module not found"

**확인:**  
`package.json`에서 **pdfkit은 반드시 `dependencies`**에 있어야 함.  
API Route에서 PDF 생성하므로 **runtime dependency**이지, dev-only가 아님.

### 2️⃣ 번들러가 Node 전용 패키지를 번들하려다 실패 (이 프로젝트에서 발생한 케이스)

- **pdfkit은 이미 `dependencies`에 있고**, `package-lock.json`에도 포함되어 설치됨
- 그런데 **Next.js 16 Turbopack**이 빌드 시 서버 번들 안에 pdfkit을 **넣으려다** "Can't resolve 'pdfkit'" 발생
- pdfkit은 Node 전용(stream, Buffer, optional native)이라 웹팩/Turbopack 번들에 넣기 어렵거나 비권장

**해결:**  
Next에게 “pdfkit은 번들하지 말고, 런타임에 `node_modules`에서 불러와”라고 알려주기 → **`serverExternalPackages: ["pdfkit"]`** (`next.config.ts`)

---

## 이 저장소에서의 정확한 원인

- **package.json**: pdfkit이 이미 **dependencies**에 있음 ✅  
- **package-lock.json**: pdfkit 포함되어 커밋됨 ✅  
- 따라서 **1️⃣(dev에 넣어둠 / lock 미커밋 / --omit=dev로 빠짐)은 해당 없음.**

**실제 원인:**  
**2️⃣ Turbopack 빌드 시 pdfkit을 번들로 resolve하려다 실패**한 것.  
그래서 **`serverExternalPackages: ["pdfkit"]`** 로 번들에서 제외해 두었고, 이 설정으로 빌드 통과.

---

## 정석 점검 체크리스트 (지금 상태)

| 항목 | 기대 | 현재 |
|------|------|------|
| pdfkit | `dependencies` | ✅ `dependencies` (^0.17.2) |
| pg | `dependencies` | ✅ `dependencies` |
| zod | `dependencies` | ✅ `dependencies` |
| @types/pdfkit | `devDependencies` 또는 없음 | 없음 (선택, pdfkit은 @types 없이 사용 중) |
| package-lock.json | 커밋됨 | ✅ 커밋됨 |
| Next 빌드 시 pdfkit | 번들 제외 후 node에서 로드 | ✅ `serverExternalPackages: ["pdfkit"]` |

---

## Railway 재배포 시 확인할 것

1. **빌드 로그**에 `added pdfkit` 또는 pdfkit이 설치되는 내용이 나오는지
2. **에러**가 "Can't resolve 'pdfkit'"이면 → `next.config.ts`에 `serverExternalPackages: ["pdfkit"]` 있는지
3. **에러**가 "Cannot find module 'pdfkit'"(런타임)이면 → pdfkit이 `dependencies`에 있는지, `npm install`이 dev 제외로만 돌지 않았는지 확인

---

## 요약

- **“Module not found: Can't resolve 'pdfkit'”** = **번들러(Turbopack)가 모듈을 찾지 못한 것** (이번 케이스).
- **“실제로 node_modules에 없음”**이면 dependency 위치/install 옵션(1️⃣) 점검.
- **이 프로젝트**: dependency는 이미 정석이고, **serverExternalPackages로 번들 제외**해서 해결된 상태.
