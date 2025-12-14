import type { CommentStatusType } from '../constants/comment-status';

export interface CommentCreateRequestDto {
  content: string;
  authorName: string;
  authorId?: string;
  version: number;
  pageNumber: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  selectedText?: string;
  section?: string;
}

export interface CommentReplyRequestDto {
  content: string;
  authorName: string;
  authorId?: string;
}

export interface CommentStatusUpdateRequestDto {
  status: CommentStatusType;
}
