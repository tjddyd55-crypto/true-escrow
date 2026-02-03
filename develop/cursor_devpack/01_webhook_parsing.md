# STEP 1. Lemon Webhook 파싱

목표: Lemon Squeezy webhook 수신 시 dealId / milestoneId 추출

- Endpoint: POST /api/webhooks/lemonsqueezy
- 해야 할 일:
  - Raw body JSON 파싱
  - event_name 추출
  - attributes.checkout_data.custom.dealId, milestoneId 추출
  - 로그 출력

완료 기준:
- order_paid 이벤트 수신 시 로그가 찍힌다.
