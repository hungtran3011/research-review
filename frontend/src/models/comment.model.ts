export interface CommentDto {
  id: string
  version: number
  pageNumber: number
  position?: { x: number; y: number; width?: number; height?: number }
  selectedText?: string
  content: string
  author: string
  authorId: string
  createdAt: Date
  status: 'open' | 'resolved' | 'addressed'
  replies?: CommentDto[]
  section?: string
}

export type CommentStatus = 'open' | 'resolved' | 'addressed'
