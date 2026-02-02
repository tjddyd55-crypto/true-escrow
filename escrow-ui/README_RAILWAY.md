# Railway 배포 가이드

## Frontend + Backend 분리 배포

### 아키텍처

```
[Browser]
   ↓
[Next.js Frontend]  (Railway Service A)
   ↓ REST API
[Spring Boot Backend] (Railway Service B)
   ↓
[Lemon Squeezy Checkout]
```

## Railway Frontend Service 설정

### 1. Railway Dashboard

1. **New Service** 클릭
2. **Source**: GitHub 선택
3. **Repository**: `true-escrow` 선택
4. **Root Directory**: `escrow-ui` 설정
5. **Framework**: Next.js 자동 감지

### 2. Railway Variables (Frontend Service)

**Variables** 탭에서 다음 환경 변수 설정:

```env
NEXT_PUBLIC_API_BASE_URL=https://true-escrow-production.up.railway.app

LEMON_API_KEY=sk_test_xxx
LEMON_STORE_ID=숫자
LEMON_VARIANT_ID=숫자
```

### 3. Build & Start

Railway이 자동으로 감지:
- **Build**: `npm run build`
- **Start**: `npm run start`

### 4. 배포 확인

배포 완료 후 생성된 URL 예시:
- `https://true-escrow-web.up.railway.app`

## 테스트 플로우

1. `/` - Landing 페이지
2. `/deal/new` - Create Deal
3. `/deal/deal-demo-001` - Deal 상세
4. **Proceed Payment** 버튼 클릭
5. Lemon Checkout 페이지 열림 (USD Test)

## 완료 조건

- ✅ 프론트 배포 URL에서 UI 정상 노출
- ✅ `/deal/:id` 페이지 404 아님
- ✅ 결제 버튼 클릭 시 Lemon Checkout 이동
- ✅ Lemon Orders에 Test Order 생성
- ✅ 백엔드 URL 직접 접속 시 Whitelabel 나와도 무관

## 문제 해결

### 환경 변수 확인
- Railway Variables에서 모든 변수가 설정되었는지 확인
- `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트에서 접근 가능

### Lemon API 에러
- `LEMON_API_KEY`가 올바른지 확인
- Test API Key를 사용 중인지 확인
- Store ID와 Variant ID가 올바른지 확인
