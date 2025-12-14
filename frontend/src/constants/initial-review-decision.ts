export const InitialReviewDecision = {
  SEND_TO_REVIEW: 'SEND_TO_REVIEW',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
  REJECT: 'REJECT',
} as const;

export type InitialReviewDecisionType =
  typeof InitialReviewDecision[keyof typeof InitialReviewDecision];
