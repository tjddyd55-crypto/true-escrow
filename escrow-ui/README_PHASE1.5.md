# Phase 1.5 – Lemon Submission UI Pack

## 목적
Lemon Squeezy 심사 기준을 충족하기 위한 최소 필수 UI 패키지

## 추가된 페이지

1. **`/payment-info`** - 결제 안내 (심사 핵심)
   - Escrow 시스템 설명
   - 결제 후 흐름 명시
   - 분쟁 처리 안내

2. **`/terms`** - 이용약관
   - 서비스 약관 명시

3. **`/privacy`** - 개인정보 처리방침
   - 데이터 수집 및 사용 정책

4. **`/refund`** - 환불 정책 (심사 필수)
   - 환불 조건 및 절차

## 수정된 페이지

1. **`/` (메인)** - Lemon 제출용 텍스트로 보완
   - 서비스 설명 명확화
   - 필수 링크 네비게이션 추가

2. **`/deal/[id]`** - 결제 버튼 근처 안내 문구 추가
   - Escrow 보유 및 해제 조건 명시

## Lemon 심사용 설명 문구

심사 폼에 사용할 수 있는 표준 설명:

```
This is a milestone-based escrow platform.
Users create a demo transaction, review payment information,
and proceed to a Lemon Squeezy checkout.
Payments are held in escrow and released only after milestone confirmation.
Refund policies and terms are clearly displayed on the website.
```

## 검증 체크리스트

- ✅ 메인 페이지에 서비스 설명 명확히 표시
- ✅ `/payment-info` 페이지 존재 및 접근 가능
- ✅ `/terms` 페이지 존재 및 접근 가능
- ✅ `/privacy` 페이지 존재 및 접근 가능
- ✅ `/refund` 페이지 존재 및 접근 가능
- ✅ 결제 버튼 근처에 안내 문구 표시
- ✅ 모든 필수 링크가 메인 페이지에서 접근 가능

## 다음 단계

이 패키지 완료 후:
1. Lemon Squeezy Store 등록
2. 심사 폼 제출
3. 실결제 테스트 진행
