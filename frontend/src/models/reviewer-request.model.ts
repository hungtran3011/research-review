export interface ReviewerRequestDto {
  name: string;
  email: string;
  institutionId: string;
  userId?: string;
  articleId: string;
}