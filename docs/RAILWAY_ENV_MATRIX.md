# Railway 환경변수 매트릭스

## 1) 변수 분류 규칙

- `PUBLIC`: 클라이언트 노출 허용 (`NEXT_PUBLIC_*`)
- `SECRET`: 절대 코드/로그 노출 금지 (Railway Secret로 저장)
- `INTERNAL`: 서버 내부 사용, 클라이언트 비노출

## 2) 서비스별 변수 표

| Service | Key | Required | Type | Scope | 설명 |
|---|---|---|---|---|---|
| escrow-ui | NEXT_PUBLIC_API_BASE_URL | Yes | URL | PUBLIC | UI가 호출할 Backend API 기준 URL |
| escrow-ui | NEXT_PUBLIC_APP_URL | No | URL | PUBLIC | UI 자체 canonical URL/링크 생성 용도 |
| escrow-ui | NODE_ENV | Yes | STRING | INTERNAL | `production` 고정 |
| escrow-backend | DATABASE_URL | Yes | URL | SECRET | Railway Postgres 연결 문자열 |
| escrow-backend | CORS_ALLOWED_ORIGINS | Yes | CSV | INTERNAL | UI 도메인 allowlist |
| escrow-backend | JWT_SECRET | Depends | STRING | SECRET | JWT 서명키 (인증 도입 시 필수) |
| escrow-backend | CHAIN_ENABLED | No | BOOL | INTERNAL | 블록체인 기능 토글 |
| escrow-backend | WEB3_RPC_URL | Depends | URL | SECRET | 체인 RPC 엔드포인트 |
| escrow-backend | CONTRACT_ADDRESS | Depends | STRING | INTERNAL | 배포 컨트랙트 주소 |
| escrow-backend | WEB3_PRIVATE_KEY | Depends | STRING | SECRET | 온체인 서명 키 |

## 3) 환경별 권장값

### Production

- `NODE_ENV=production`
- `CORS_ALLOWED_ORIGINS=https://<escrow-ui-domain>`
- `CHAIN_ENABLED=false` (초기 안정화 기간)

### Staging

- 별도 Railway Environment 생성
- `NEXT_PUBLIC_API_BASE_URL`를 staging backend 도메인으로 분리
- 운영 키(`JWT_SECRET`, `WEB3_PRIVATE_KEY`) 재사용 금지

## 4) 네트워크/보안 원칙

- UI -> DB 직접 연결 금지
- Backend만 DB 접근
- Secret 값은 문서/코드/PR 코멘트에 평문 기록 금지

## 5) 증상 기반 트러블슈팅 (Symptom -> Cause -> Fix)

### 1. UI 빌드에서 Gradle 실행됨

- Cause: 루트 `railway.json` 또는 잘못된 Root Directory
- Fix: 루트 `railway.json` 제거, UI Root Directory=`escrow-ui`

### 2. `Can't resolve pdfkit`

- Cause: 서버 전용 패키지 번들 설정 누락 또는 dependency 누락
- Fix: `package.json` dependency 확인 + Next server external package 설정 확인

### 3. `POST /api/engine/blocks/:id/questions` 500

- Cause: 스키마 미적용, `label`/`order_index` 제약 불일치, 기본값 누락
- Fix:
  - migration 적용 확인
  - `escrow_block_questions` 제약 확인 (`NOT NULL`, unique `(block_id, order_index)`)
  - API body 기본값(type/label/options) 확인

### 4. CORS 에러

- Cause: Backend 허용 origin 미설정
- Fix: `CORS_ALLOWED_ORIGINS`에 UI 도메인 추가

### 5. `relation does not exist`

- Cause: DB migration 누락
- Fix: 배포 환경에서 migration 실행 여부 및 버전 테이블 상태 확인
