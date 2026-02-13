export const en = {
  // Transaction Builder
  slogan: "Design your transaction.",
  transactionTitle: "Transaction Title",
  transactionDescription: "Transaction Description",
  overallDuration: "Overall Duration",
  startDate: "Start date",
  endDate: "End date",
  status: "Status",
  activateTransaction: "Activate Transaction",
  
  // Blocks
  blocks: "Blocks",
  addBlock: "+ Add Block",
  blockTitle: "Block Title",
  period: "Period",
  day: "Day",
  active: "Active",
  locked: "Locked",
  delete: "Delete",
  splitBlock: "Split Block",
  reorder: "Reorder",
  
  // Approval Policy
  approvalPolicy: "Approval Policy",
  lockedAfterActivation: "Locked after activation",
  
  // Approvers
  approvers: "Approvers",
  addApprover: "+ Add Approver",
  noApproversYet: "No approvers yet",
  required: "(required)",
  optional: "(optional)",
  remove: "Remove",
  enterRole: "Enter role (BUYER/SELLER/VERIFIER):",
  enterDisplayName: "Enter display name:",
  
  // Block Questions
  blockQuestions: "Block Questions",
  addQuestion: "+ Add Question",
  questionType: "Question type",
  questionLabel: "Question label",
  questionDescription: "Description (optional)",
  options: "Options",
  datePickerNote: "Answer will use date picker when filling.",
  fileUploadPlaceholder: "File upload (metadata-first).",
  noQuestionsYet: "No questions yet.",

  // Work Rules
  workRules: "Work Rules",
  addRule: "+ Add Rule",
  workType: "Work Type",
  workRuleTitle: "Title",
  quantity: "Quantity",
  frequency: "Frequency",
  dueDates: "Due Dates",
  dueDatesDerivedFromBlock: "Due dates are derived from block period.",
  once: "ONCE",
  daily: "DAILY",
  weekly: "WEEKLY",
  custom: "CUSTOM",
  
  // Work Items
  workItems: "Work Items",
  submit: "Submit",
  approve: "Approve",
  pending: "PENDING",
  submitted: "SUBMITTED",
  approved: "APPROVED",
  rejected: "REJECTED",
  approveBlock: "Approve Block",
  
  // Timeline
  timeline: "Timeline",
  calendar: "Calendar",

  // Activity Log
  activityLog: "Activity Log",
  
  // Transaction New
  createNewTransaction: "Create New Transaction",
  selectTemplate: "Select Template",
  orCreateBlank: "Or create blank transaction",
  startBuilding: "Start Building",
  
  // Common
  loading: "Loading...",
  transactionNotFound: "Transaction not found",
  error: "Error",

  // Execution Plan (Preview / PDF)
  executionPlan: {
    title: "Execution Plan",
    start: "Transaction start",
    end: "Transaction end",
    downloadPdf: "Download PDF",
    preview: "Preview",
    daysElapsed: "({n} days elapsed)",
    durationDays: "({n} days)",
    approvals: "Approvals",
    conditions: "Conditions",
    payoutRule: "Payout",
    blockCount: "Blocks",
    totalDays: "Total days",
    parties: "Parties",
    dateUnset: "Date not set",
    conditionFallback: "Condition",
    approvalBuyer: "Buyer approval",
    approvalSeller: "Seller approval",
    approvalAdmin: "Admin approval",
    approvalVerifier: "Verifier approval",
    payoutFull: "Full payment",
    payoutRatio: "{pct}% payment",
    payoutFixed: "{amount} fixed payment",
    payoutNone: "No payment",
    payoutUnset: "—",
  },

  // Template labels (i18n key based)
  template: {
    quick_delivery: {
      title: "Delivery / Used Goods",
      description: "Payment is released after delivery confirmation.",
      block_payment: "Payment",
      block_receive: "Receive confirmation",
    },
    moving_service: {
      title: "Moving Service",
      description: "Final payment is released after move completion confirmation.",
      block_deposit: "Deposit",
      block_start: "Move start",
      block_complete: "Move complete",
      block_final: "Final payment",
    },
    unknown: {
      title: "Template",
    },
  },
};
