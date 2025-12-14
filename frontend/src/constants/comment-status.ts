export const CommentStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  ADDRESSED: 'ADDRESSED',
} as const;

export type CommentStatusType = typeof CommentStatus[keyof typeof CommentStatus];