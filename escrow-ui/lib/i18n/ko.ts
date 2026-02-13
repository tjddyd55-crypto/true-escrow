export const ko = {
  // Transaction Builder
  slogan: "거래를 설계하세요.",
  transactionTitle: "거래 제목",
  transactionDescription: "거래 설명",
  overallDuration: "전체 기간",
  startDate: "시작일",
  endDate: "종료일",
  status: "상태",
  activateTransaction: "거래 활성화",
  
  // Blocks
  blocks: "블록",
  addBlock: "+ 블록 추가",
  blockTitle: "블록 제목",
  period: "기간",
  day: "일",
  active: "활성",
  locked: "잠김",
  delete: "삭제",
  splitBlock: "블록 분할",
  reorder: "순서 변경",
  
  // Approval Policy
  approvalPolicy: "승인 정책",
  lockedAfterActivation: "활성화 후 수정 불가",
  
  // Approvers
  approvers: "승인자",
  addApprover: "+ 승인자 추가",
  noApproversYet: "승인자가 없습니다",
  required: "(필수)",
  optional: "(선택)",
  remove: "제거",
  enterRole: "역할을 입력하세요 (BUYER/SELLER/VERIFIER):",
  enterDisplayName: "표시 이름을 입력하세요:",
  
  // Block Questions
  blockQuestions: "블록 질문",
  addQuestion: "+ 질문 추가",
  questionType: "질문 유형",
  questionLabel: "질문 라벨",
  questionDescription: "설명 (선택)",
  options: "선택지",
  datePickerNote: "응답 시 날짜 선택기로 입력됩니다.",
  fileUploadPlaceholder: "파일 업로드 (메타데이터 먼저 저장)",
  noQuestionsYet: "아직 질문이 없습니다.",

  // Work Rules
  workRules: "작업 규칙",
  addRule: "+ 작업 규칙 추가",
  workType: "작업 유형",
  workRuleTitle: "제목",
  quantity: "수량",
  frequency: "빈도",
  dueDates: "마감일",
  dueDatesDerivedFromBlock: "마감일은 블록 기간에서 파생됩니다.",
  once: "한 번",
  daily: "매일",
  weekly: "매주",
  custom: "사용자 정의",
  
  // Work Items
  workItems: "작업 항목",
  submit: "제출",
  approve: "승인",
  pending: "대기 중",
  submitted: "제출됨",
  approved: "승인됨",
  rejected: "거부됨",
  approveBlock: "블록 승인",
  
  // Timeline
  timeline: "타임라인",
  calendar: "달력",

  // Activity Log
  activityLog: "활동 로그",
  
  // Transaction New
  createNewTransaction: "새 거래 만들기",
  selectTemplate: "템플릿 선택",
  orCreateBlank: "또는 빈 거래 만들기",
  startBuilding: "설계 시작",
  
  // Common
  loading: "로딩 중...",
  transactionNotFound: "거래를 찾을 수 없습니다",
  error: "오류",

  // Execution Plan (미리보기 / PDF)
  executionPlan: {
    title: "거래 실행 명세서",
    start: "거래 시작",
    end: "거래 종료",
    downloadPdf: "PDF 다운로드",
    preview: "미리보기",
    daysElapsed: "({n}일 경과)",
    durationDays: "({n}일)",
    approvals: "승인자",
    conditions: "조건",
    payoutRule: "지급 규칙",
    blockCount: "블록 수",
    totalDays: "총 일수",
    parties: "당사자",
    dateUnset: "날짜 미설정",
    conditionFallback: "조건",
    approvalBuyer: "구매자 승인",
    approvalSeller: "판매자 승인",
    approvalAdmin: "관리자 승인",
    approvalVerifier: "검수자 승인",
    payoutFull: "전액 지급",
    payoutRatio: "{pct}% 지급",
    payoutFixed: "{amount} 고정 지급",
    payoutNone: "지급 없음",
    payoutUnset: "—",
  },

  // Template labels (i18n key 기반)
  template: {
    quick_delivery: {
      title: "택배 / 중고 거래",
      description: "배송 완료 확인 후 대금이 지급됩니다.",
      block_payment: "결제",
      block_receive: "수령 확인",
    },
    moving_service: {
      title: "이사 거래",
      description: "이사 완료 확인 후 잔금이 지급됩니다.",
      block_deposit: "계약금",
      block_start: "이사 시작",
      block_complete: "이사 완료",
      block_final: "잔금 지급",
    },
    unknown: {
      title: "템플릿",
    },
  },
};
