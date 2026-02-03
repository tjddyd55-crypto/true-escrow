# Lemon Squeezy 401 Unauthenticated 디버깅 가이드

## 개요

Production에서 Lemon Checkout 생성 시 401 에러가 발생하는 경우, 이 문서를 따라 단계별로 원인을 확인하세요.

## A. 배포 버전 확인 (최우선)

### A1) /api/health 엔드포인트 확인

Production URL에서 다음을 호출:
```
GET https://escrow-ui-production.up.railway.app/api/health
```

응답 예시:
```json
{
  "commitSha": "cac9f9b...",
  "buildTime": "2025-01-15T10:30:00Z",
  "lemonStoreIdPresent": true,
  "lemonVariantIdPresent": true,
  "lemonKeyPrefix": "sk_test_",
  "apiBaseUrl": "https://...",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### A2) 확인 사항

1. **commitSha 확인**
   - GitHub 최신 커밋과 일치하는지 확인
   - 불일치 시 Railway 재배포 필요

2. **lemonKeyPrefix 확인**
   - `"sk_test_"` 또는 `"sk_live_"`인지 확인
   - `null`이면 환경변수 누락

3. **lemonStoreIdPresent / lemonVariantIdPresent**
   - 둘 다 `true`여야 함
   - `false`면 환경변수 누락

## B. 로그에서 확인할 5줄 (401 발생 시)

Railway 로그에서 다음 5줄을 찾으세요:

```
[<requestId>] 1) API URL (전체 문자열): https://api.lemonsqueezy.com/v1/checkouts
[<requestId>] 3) process.env.LEMON_API_KEY prefix: sk_test_
[<requestId>]    - store_id: 805905
[<requestId>]    - variant_id: 1270810
[<requestId>] 8) Response Body (전체 원문): {"errors":[...]}
```

## C. 401 원인 분기 체크리스트

### C1) API Key 모드 불일치

**증상:**
- Lemon Dashboard에서 Test mode가 ON인데 `sk_live_` 사용
- 또는 Live mode인데 `sk_test_` 사용

**확인 방법:**
1. Lemon Dashboard → Settings → API Keys
2. 현재 사용 중인 Key의 prefix 확인 (`sk_test_` 또는 `sk_live_`)
3. Dashboard에서 Test mode ON/OFF 상태 확인
4. Test mode ON이면 `sk_test_`만 사용 가능
5. Test mode OFF이면 `sk_live_`만 사용 가능

**해결:**
- Test mode ON → `LEMON_API_KEY`를 `sk_test_`로 시작하는 키로 변경
- Test mode OFF → `LEMON_API_KEY`를 `sk_live_`로 시작하는 키로 변경

### C2) Store/Variant 소속 불일치

**증상:**
- `LEMON_STORE_ID`와 `LEMON_VARIANT_ID`가 서로 다른 Store에 속함

**확인 방법:**

1. **Lemon Dashboard에서 확인:**
   - Products → Variant 선택
   - URL에서 Store ID 확인: `https://app.lemonsqueezy.com/stores/{storeId}/products/...`

2. **API로 확인 (개발 중):**
   
   **방법 1: Debug Helper 엔드포인트 사용 (권장)**
   ```
   GET /api/debug/lemon-variant?variantId=1270810
   ```
   - Development 모드에서만 사용 가능
   - Production에서는 `ENABLE_LEMON_DEBUG=true` 환경변수 필요
   - 응답 예시:
     ```json
     {
       "variantId": "1270810",
       "storeId": "805905",
       "expectedStoreId": "805905",
       "match": true
     }
     ```
   
   **방법 2: 직접 API 호출**
   ```bash
   curl -H "Authorization: Bearer sk_test_xxx" \
        -H "Accept: application/vnd.api+json" \
        https://api.lemonsqueezy.com/v1/variants/{variantId}
   ```
   - 응답에서 `relationships.store.data.id` 확인
   - 이 값이 `LEMON_STORE_ID`와 일치해야 함

**주의:**
- ❌ Product ID를 Store ID로 착각하지 말 것
- ❌ Variant ID를 Store ID로 착각하지 말 것
- ✅ Store는 Lemon의 최상위 리소스 (Store → Product → Variant)

**해결:**
- `LEMON_STORE_ID`를 Variant가 속한 Store ID로 변경
- 또는 `LEMON_VARIANT_ID`를 해당 Store의 Variant ID로 변경

### C3) 헤더 규격 체크

**확인 사항:**
- `Content-Type: application/vnd.api+json` (❌ `application/json` 아님)
- `Accept: application/vnd.api+json` (❌ `application/json` 아님)
- `Authorization: Bearer <key>` (공백 없이)

**로그에서 확인:**
```
[<requestId>] 4) Headers 전체:
[<requestId>]    {
[<requestId>]      "Authorization": "Bearer sk_test_...",
[<requestId>]      "Accept": "application/vnd.api+json",
[<requestId>]      "Content-Type": "application/vnd.api+json"
[<requestId>]    }
```

**주의:**
- API Key에 앞뒤 공백이 있으면 자동으로 trim 처리됨
- 로그에서 "Trim 필요 여부" 확인

### C4) API 도메인/경로 체크

**확인 사항:**
- URL: `https://api.lemonsqueezy.com/v1/checkouts` (정확히)
- ❌ `app.lemonsqueezy.com` 도메인 사용 금지
- ❌ `/checkout/buy` 경로 사용 금지 (이건 프론트엔드 URL)

**로그에서 확인:**
```
[<requestId>] 1) API URL (전체 문자열): https://api.lemonsqueezy.com/v1/checkouts
[<requestId>]    - URL 확인: ✅ 정확함
[<requestId>]    - 도메인 확인: ✅ api.lemonsqueezy.com
```

### C5) 네트워크/프록시/런타임 문제

**확인 방법:**
1. 로컬에서 동일한 환경변수로 테스트
2. `/api/health`로 production과 local의 env 값 비교
3. Railway outbound 차단 여부 확인 (일반적으로 없음)

## D. 해결 후 체크리스트

✅ Production: `GET /api/health` 확인 (commit/env)
✅ Production: `/deal/deal-demo-001` → "Proceed Payment" 클릭
✅ Network 탭에서 `POST /api/deals/deal-demo-001/checkout`가 200인지 확인
✅ Lemon Checkout 페이지가 열리는지 확인
✅ Railway 로그에서 requestId로 전체 호출 trace 확인
✅ Lemon Dashboard → Orders에서 order 생성 확인

## E. 일반적인 실수

### E1) Store ID 착각

**잘못된 예:**
- Product URL: `https://app.lemonsqueezy.com/stores/805905/products/12345`
- Product ID (`12345`)를 Store ID로 사용 ❌

**올바른 예:**
- Store ID는 `805905` ✅

### E2) Variant → Store 관계 확인 방법

```bash
# Variant 정보 조회
curl -H "Authorization: Bearer sk_test_xxx" \
     -H "Accept: application/vnd.api+json" \
     https://api.lemonsqueezy.com/v1/variants/1270810

# 응답에서 확인:
# {
#   "data": {
#     "relationships": {
#       "store": {
#         "data": {
#           "type": "stores",
#           "id": "805905"  ← 이 값이 LEMON_STORE_ID와 일치해야 함
#         }
#       }
#     }
#   }
# }
```

## F. Railway 로그에서 찾을 키워드

401 에러 발생 시 로그에서 다음 키워드로 검색:
- `[<requestId>]` - 전체 호출 trace
- `401 Unauthenticated` - 에러 원인
- `C1) API Key 모드 체크` - 모드 불일치 확인
- `C2) Store/Variant 소속 체크` - 소속 관계 확인
- `Response Body (전체 원문)` - Lemon API 에러 메시지

## G. 연락처 및 추가 지원

문제가 지속되면:
1. Railway 로그 전체 복사 (requestId 포함)
2. `/api/health` 응답 JSON
3. Lemon Dashboard 스크린샷 (Store ID, Variant ID, Test mode 상태)
4. 위 정보를 함께 제공
