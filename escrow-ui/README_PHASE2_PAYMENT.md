# Phase 2 – Payment Test

## 목적
Lemon Squeezy 실결제 테스트를 통한 end-to-end 검증

## 사전 요구사항

1. **Lemon Squeezy Store 생성**
   - https://app.lemonsqueezy.com 접속
   - Store 생성 완료

2. **Variant 생성**
   - Store 내에서 Product 생성
   - Variant 생성 (USD 기준)
   - Variant ID 확인

3. **API Key 발급**
   - Settings → API Keys
   - Test API Key 생성
   - API Key 복사

## 환경 변수 설정

`.env.local` 파일 수정:

```env
LEMON_API_KEY=sk_test_실제_API_KEY
LEMON_STORE_ID=실제_STORE_ID
LEMON_VARIANT_ID=실제_VARIANT_ID
```

## 실행

```bash
npm run dev
```

## 테스트 시나리오

1. http://localhost:3000 접속
2. "Create Deal" 클릭
3. "🚗 Used Car Transaction" 클릭
4. "Proceed Payment" 버튼 클릭
5. Lemon Checkout 페이지 열림 확인
6. 테스트 카드로 결제 시도:
   - 카드 번호: `4242 4242 4242 4242`
   - 만료일: 미래 날짜
   - CVC: 임의 3자리
   - ZIP: 임의 5자리

## 성공 조건

- ✅ Lemon Checkout 페이지가 새 탭에서 열림
- ✅ 테스트 카드 결제 성공
- ✅ 결제 완료 후 리다이렉트 동작

## 문제 해결

### "Lemon API error" 발생 시
- API Key가 올바른지 확인
- Store ID와 Variant ID가 올바른지 확인
- Test API Key를 사용 중인지 확인 (Production은 별도)

### Checkout URL이 생성되지 않을 때
- 브라우저 콘솔에서 에러 확인
- 서버 로그 확인 (`npm run dev` 터미널)
