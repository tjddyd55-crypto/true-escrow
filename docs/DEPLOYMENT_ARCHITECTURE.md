# 배포 아키텍처 (Railway, true-escrow 모노레포)

## 1) 배경과 문제

이 저장소는 모노레포이며 서비스 성격이 다릅니다.

- `escrow-ui`: Next.js 프론트엔드 (Node/Nixpacks 적합)
- `escrow-backend`: Spring Boot API (Docker/Gradle 적합)

과거에는 루트 `railway.json`이 전체 서비스에 적용되어, `escrow-ui`에서도 Docker+Gradle 빌드가 강제되었습니다.
그 결과 UI 서비스에서 `gradle build`가 실행되며 빌드 실패가 발생했습니다.

## 2) 목표 구조 (최적 토폴로지)

### Service A: `escrow-ui` (Public)

- 역할: 사용자 웹 진입점
- Builder: `Nixpacks`
- Root Directory: `escrow-ui`
- Install: `npm install`
- Build: `npm run build`
- Start: `npm run start`
- Public Networking: `ON`

### Service B: `escrow-backend` (Public API)

- 역할: 도메인/비즈니스 API
- Builder: `Dockerfile`
- Root Directory: `escrow-backend`
- Dockerfile Path: `Dockerfile` (root dir 기준)
- Public Networking: `ON`

### Service C: `Postgres` (Private)

- 역할: 영속 데이터 저장
- Railway Managed Postgres Plugin 사용
- Public Networking: `OFF`

## 3) 빌드 우선순위 원칙

- Railway는 서비스별 Root Directory 기준으로 빌드 컨텍스트를 해석합니다.
- 서비스 루트 내부 `railway.json`은 해당 서비스에만 적용됩니다.
- 루트(모노레포 최상단) `railway.json`은 의도치 않게 타 서비스에 영향 줄 수 있으므로 제거합니다.

## 4) 네트워킹 전략

### UI -> Backend

- 기본: `NEXT_PUBLIC_API_BASE_URL=https://<backend-public-domain>`
- 내부 네트워크 URL을 사용하려면 CORS 및 도메인 전략을 별도로 관리해야 하므로 초기에는 Public URL 고정 권장

### Backend -> Postgres

- `DATABASE_URL`을 Railway Postgres Plugin에서 주입
- 애플리케이션 레벨에서 별도 호스트 하드코딩 금지

## 5) 운영 안정성 원칙

- 서비스별 독립 배포: UI 실패가 Backend 배포를 막지 않게 구성
- 롤백: Railway에서 이전 Deployment 재배포
- DB 마이그레이션: 항상 backward-compatible 원칙(파괴적 변경 지양)
- 장애 전파 차단: UI는 DB 직접 접속 금지(Backend 경유)

## 6) 향후 확장 로드맵

- Phase A (현재): UI + Backend + Postgres
- Phase B: 첨부파일 업로드(S3/R2) + Backend presigned URL 발급
- Phase C: 비동기 작업(큐/워커) - PDF 생성, 체인 기록, 알림 처리
- Phase D: 템플릿 라이브러리/계정/멀티테넌시 분리

## 7) 적용 후 확인 기준

- `escrow-ui` 빌드 로그에 `npm run build`가 보여야 함
- `escrow-backend` 빌드 로그에 `gradle build`가 보여야 함
- UI 로그에서 Gradle 실행 흔적이 없어야 함
