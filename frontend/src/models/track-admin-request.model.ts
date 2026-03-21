export interface AdminTrackConfigCreateRequestDto {
  name: string;
  description?: string | null;
  isActive?: boolean;
  reviewPolicyMinCompletedReviews?: number | null;
}

export interface AdminTrackConfigUpdateRequestDto {
  name: string;
  description?: string | null;
  isActive: boolean;
  reviewPolicyMinCompletedReviews?: number | null;
}
