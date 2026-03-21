import type { AuthorDto } from './author.model';

export interface ArticleRequestDto {
  id?: string;
  title: string;
  abstract: string;
  conclusion: string;
  link: string;
  conferenceId: string;
  trackId: string;
  topicIds: string[];
  trackName?: string;
  authors: AuthorDto[];
}