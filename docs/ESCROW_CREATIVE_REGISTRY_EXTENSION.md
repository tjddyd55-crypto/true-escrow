# Escrow Business — Creative Registry Extension (SSOT)

## 0) 목적
에스크로 시스템을 “결제 전용”이 아니라,
**창작물 존재 확인(확정) 인프라**로 확장한다.

- 저작권 등록/보호 기관 ❌
- 독창성/원작 판별/법적 판단 ❌
- 제공 기능: 사실 기록(해시+타임스탬프+계정) + 변경 검증 가능성(앵커링) + 증거 패키지 출력 ✅

## 1) 핵심 원칙
1) Append-only: UPDATE/DELETE 금지, 변경은 새 레코드(버전)
2) Identity = escrow_account_id: 모든 기록의 주체
3) On-chain에는 원본 저장 금지: 해시/루트만 앵커
4) “판단 API” 금지: exists_at/registered_at 등 사실 API만 제공

## 2) 데이터 모델(개념)
### 2.1 assets
- id (asset_id)
- escrow_account_id
- asset_type (LYRIC/DEMO_AUDIO/…)
- visibility (PUBLIC/AUDITION_ONLY/PRIVATE)
- declared_creation_type (HUMAN/AI_ASSISTED/AI_GENERATED)
- created_at

### 2.2 asset_versions (append-only)
- id
- asset_id
- content_hash (sha256)
- payload_meta (size, mime, checksum_meta, optional)
- created_at

### 2.3 registry_log (append-only 감사/이벤트)
- id
- escrow_account_id
- asset_id
- event_type (ASSET_REGISTERED / VERSION_ADDED / VISIBILITY_CHANGED* / EVIDENCE_EXPORTED / REFERENCED …)
- event_hash (event payload hash)
- created_at
*정책상 visibility 변경은 허용 가능하나, 변경 이력은 반드시 새 이벤트로 남김(원본 수정 금지)

## 3) 불변성(Immutability) 확보
### 3.1 내부 레지스트리
- DB 레벨에서 update/delete 차단(권한/트리거/정책)
- 모든 이벤트는 append-only로만 기록
- 감사 로그(관리자 액션 포함) 필수

### 3.2 퍼블릭 블록체인 앵커링(권장)
- 주기: 1일 1회 또는 N건 단위
- 대상: 해당 기간 registry_log(또는 asset_versions) 해시를 모아 Merkle Root 생성
- 온체인 기록: Merkle Root 해시 + 앵커 메타(기간/카운트)
- 원본 데이터/PII는 온체인 저장 금지

효과:
- 내부 데이터 변경 시 체인 앵커와 불일치 → 사후 조작 “검증 불가” 상태 달성

## 4) Evidence Export (증거 패키지)
- 출력물: PDF + JSON
- 포함:
  - asset_id, escrow_account_id
  - 등록 시각, 버전 목록
  - 각 버전 content_hash
  - 관련 registry_log 요약
  - 앵커링 tx 정보(있을 경우)
- 목적:
  - “이 시점에 이 형태로 존재했다”를 제3자 검증 가능한 형태로 제시

## 5) API (MVP)
- POST /v1/assets
  - 입력: asset_type, declared_creation_type, visibility, (file/text) → 서버가 sha256 생성
  - 출력: asset_id, version_id, content_hash, created_at
- GET /v1/assets/{asset_id}
- POST /v1/assets/{asset_id}/versions
- GET /v1/assets/{asset_id}/evidence (pdf/json)
- POST /v1/references
  - 입력: asset_id, context_type(audition/project/external), context_id
  - 목적: 오디션/외부 서비스가 “참조 이력”을 남김

## 6) 포지션/문구(리스크 방어)
- 금지: “절대 변경 불가”, “저작권 보호 보장”, “법적 효력 보장”
- 권장:
  - “변경 불가 원장(append-only) 기반”
  - “외부 타임스탬프(블록체인 앵커)로 사후 조작 검증 가능”
  - “분쟁 시 증거 자료로 활용될 수 있음”

## 7) MVP 범위
- 내부 레지스트리(append-only) + 증거 패키지 출력 + 참조 이력 API
- 앵커링은 옵션(가능하면 포함), 최소 설계/인터페이스는 선반영
