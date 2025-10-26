import type { TrackDto } from './track.model';
import type { AuthorDto } from './author.model';
import type { ReviewerDto } from './reviewer.model';

export interface ArticleDto {
  id: string;
  title: string;
  abstract: string;
  conclusion: string;
  link: string;
  track: TrackDto;
  authors: AuthorDto[];
  reviewers: ReviewerDto[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}