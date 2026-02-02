# 환경 변수 설정 가이드

## 문제 해결

Lemon API 401 에러가 발생하는 경우, 환경 변수가 제대로 설정되지 않았을 가능성이 높습니다.

## 설정 방법

1. `escrow-ui` 폴더에 `.env.local` 파일 생성

2. 다음 내용을 추가:

```env
LEMON_API_KEY=sk_test_실제_API_KEY
LEMON_STORE_ID=실제_STORE_ID
LEMON_VARIANT_ID=실제_VARIANT_ID
```

## Lemon Squeezy 설정

1. https://app.lemonsqueezy.com 접속
2. Store 생성
3. Product 생성 → Variant 생성
4. Settings → API Keys → Test API Key 생성
5. 생성된 API Key, Store ID, Variant ID를 `.env.local`에 입력

## 서버 재시작

환경 변수 변경 후 **반드시** 서버를 재시작해야 합니다:

```bash
# Ctrl + C로 서버 중지
npm run dev
```

## 확인 방법

- 환경 변수가 설정되면: "Proceed Payment" 버튼이 활성화됨
- 환경 변수가 없으면: 빨간색 에러 박스와 "Payment Unavailable" 버튼 표시
