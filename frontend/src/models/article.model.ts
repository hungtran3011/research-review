import type { TrackDto } from './track.model';
import type { AuthorDto } from './author.model';
import type { ReviewerDto } from './reviewer.model';
import type { ArticleStatusType } from '../constants/article-status';

export interface ArticleDto {
  id: string;
  title: string;
  abstract: string;
  conclusion: string;
  link: string;
  track: TrackDto;
  status: ArticleStatusType;
  initialReviewNote?: string | null;
  initialReviewNextSteps?: string | null;
  authors: AuthorDto[];
  reviewers: ReviewerDto[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}