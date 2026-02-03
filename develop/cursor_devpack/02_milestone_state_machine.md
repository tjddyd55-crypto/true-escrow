# STEP 2. 마일스톤 상태 머신

목표: 결제 완료 시 마일스톤을 FUNDED 상태로 전환

- In-memory Map 사용 (globalThis)
- 상태: PENDING -> FUNDED
- RELEASED는 이 단계에서 금지

완료 기준:
- Webhook 후 상태가 FUNDED
