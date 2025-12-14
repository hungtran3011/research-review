import type { CommentStatusType } from '../constants/comment-status'

export interface CommentDto {
  id: string
  content: string
  authorName: string
  authorId?: string | null
  createdAt?: string | null
  createdBy?: string | null
}

export interface CommentThreadDto {
  id: string
  articleId: string
  reviewerId?: string | null
  version: number
  pageNumber: number
  x: number
  y: number
  width?: number | null
  height?: number | null
  selectedText?: string | null
  section?: string | null
  status: CommentStatusType
  comments: CommentDto[]
  createdAt?: string | null
  updatedAt?: string | null
}
