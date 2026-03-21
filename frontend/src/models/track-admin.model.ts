export interface AdminTrackConfigDto {
  id: string;
  conferenceId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  reviewPolicyMinCompletedReviews?: number | null;
  createdAt: string;
  updatedAt: string;
}
