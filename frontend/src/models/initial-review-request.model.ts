import type { InitialReviewDecisionType } from '../constants/initial-review-decision';

export interface InitialReviewRequestDto {
  decision: InitialReviewDecisionType;
  note: string;
  nextSteps?: string;
}
