import type { AuthorDto } from './author.model';

export interface ArticleRequestDto {
  id?: string;
  title: string;
  abstract: string;
  conclusion: string;
  link: string;
  trackId: string;
  trackName?: string;
  authors: AuthorDto[];
}