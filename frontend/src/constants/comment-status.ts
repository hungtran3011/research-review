export const CommentStatus = {
  OPEN: 0,
  RESOLVED: 1
} as const;

export type CommentStatusType = typeof CommentStatus[keyof typeof CommentStatus];