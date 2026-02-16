# Railway 서비스 레이아웃 가이드

## 1) 최종 디렉터리 기준

```text
repo-root/
  escrow-ui/
    package.json
    next.config.js
  escrow-backend/
    Dockerfile
    railway.json
    build.gradle
    settings.gradle
    src/
  docs/
  (NO railway.json at repo root)
```

## 2) 서비스별 Railway UI 체크리스트

### A. escrow-ui 서비스

1. Settings -> Root Directory: `escrow-ui`
2. Build -> Builder: `Nixpacks`
3. Build -> Custom Build Command: `npm install && npm run build`
4. Deploy -> Custom Start Command: `npm run start`
5. Networking -> Public Networking: Enable
6. Variables 설정:
   - `NEXT_PUBLIC_API_BASE_URL` (필수)
   - `NEXT_PUBLIC_APP_URL` (선택)
   - `NODE_ENV=production`

### B. escrow-backend 서비스

1. Settings -> Root Directory: `escrow-backend`
2. Build -> Builder: `Dockerfile`
3. Build -> Dockerfile Path: `Dockerfile`
4. Deploy -> Start Command: `java -jar app.jar` (railway.json에도 동일 정의)
5. Networking -> Public Networking: Enable
6. Variables 설정:
   - `DATABASE_URL` (Postgres plugin)
   - `CORS_ALLOWED_ORIGINS` (UI 도메인)
   - `JWT_SECRET` (사용 시)
   - 체인 설정 변수(사용 시)

### C. Postgres 서비스

1. Add Plugin -> PostgreSQL
2. Public Networking: Disable
3. `DATABASE_URL`가 backend로 주입되는지 확인

## 3) 배포 플로우

1. `main` 브랜치 push
2. Railway가 각 서비스를 Root Directory 기준으로 독립 빌드
3. UI/Backend 중 하나가 실패해도 원인 서비스만 롤백 가능

## 4) 롤백 절차

1. Railway -> 해당 서비스 -> Deployments
2. 안정 버전 선택 후 Redeploy
3. DB migration은 backward-compatible 유지 (롤백 시 스키마 충돌 방지)

## 5) 운영자 빠른 점검

- UI 로그에 Gradle이 보이면 설정 오염:
  - Root Directory 잘못 지정 또는 글로벌 `railway.json` 개입 의심
- Backend 로그에 npm build가 보이면 서비스 설정 뒤바뀐 상태
