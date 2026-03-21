export const ReviewRecommendation = {
  STRONG_ACCEPT: 'STRONG_ACCEPT',
  ACCEPT: 'ACCEPT',
  WEAK_ACCEPT: 'WEAK_ACCEPT',
  BORDERLINE: 'BORDERLINE',
  WEAK_REJECT: 'WEAK_REJECT',
  REJECT: 'REJECT',
  STRONG_REJECT: 'STRONG_REJECT',
} as const

export type ReviewRecommendationType = typeof ReviewRecommendation[keyof typeof ReviewRecommendation]

export interface StructuredReviewScoreRequestDto {
  criterion: string
  score: number
}

export interface StructuredReviewSubmitRequestDto {
  scores: StructuredReviewScoreRequestDto[]
  summaryNotes: string
  confidentialRemarks?: string | null
  recommendation: ReviewRecommendationType
  finalSubmit: boolean
}

export interface StructuredReviewScoreDto {
  criterion: string
  score: number
}

export interface StructuredReviewDto {
  id: string
  articleId: string
  reviewerId: string
  reviewerName: string
  reviewerEmail: string
  reviewerDisplayIndex: number
  recommendation: ReviewRecommendationType
  summaryNotes: string
  confidentialRemarks?: string | null
  submittedAt?: string | null
  scores: StructuredReviewScoreDto[]
}

export interface StructuredReviewAnonymizedDto {
  id: string
  articleId: string
  reviewerLabel: string
  summaryNotes: string
  submittedAt?: string | null
  scores: StructuredReviewScoreDto[]
}
