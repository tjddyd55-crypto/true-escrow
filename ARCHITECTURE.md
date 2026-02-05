# true-escrow Architecture

> **Design your transaction.**

true-escrow는 **거래를 설계하는 플랫폼**입니다.

## 핵심 아키텍처

자세한 아키텍처 선언문은 [docs/ARCHITECTURE_DECLARATION.md](./docs/ARCHITECTURE_DECLARATION.md)를 참조하세요.

### Block 중심 구조
- Transaction = 여러 Block의 순차 실행
- Block = 실행·승인·진행의 최소 단위

### WorkRule 기반 설계
- 마일스톤 나열 ❌
- 작업물의 **횟수 / 주기 / 날짜 규칙** 정의 ✅

### 자동 생성 모델
- Block 활성화 → WorkRule 기준으로 WorkItem 자동 생성

## 주요 엔드포인트

- `/transaction/new` - 새 거래 설계 시작
- `/transaction/builder/[id]` - 거래 규칙 설계
- `/buyer/dashboard` - Buyer 대시보드
- `/seller/dashboard` - Seller 대시보드
- `/admin/transactions` - Admin 거래 관리

## 기술 스택

- **Backend:** Spring Boot (Java)
- **Frontend:** Next.js 16 (TypeScript)
- **Database:** PostgreSQL
- **Migration:** Flyway

## 개발 가이드

### 아키텍처 원칙
1. Block 단위 승인 - 세밀한 통제
2. WorkRule 기반 자동화 - 반복 작업 패턴 지원
3. DRAFT/ACTIVE 분리 - 설계 단계와 실행 단계 구분

### 확장 시 주의사항
- Block 구조 수정은 **DRAFT 상태에서만** 허용
- ACTIVE 이후 구조 변경은 Admin 개입 필요
- WorkRule의 frequency/quantity/due_date로 유연성 확보

---

**See Also:**
- [Architecture Declaration](./docs/ARCHITECTURE_DECLARATION.md) - 상세 설계 결정사항
