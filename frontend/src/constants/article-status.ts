export const ArticleStatus = {
  SUBMITTED: 'SUBMITTED', // Chờ xử lý
  REJECTED: 'REJECTED', // Bị từ chối
  PENDING_REVIEW: 'PENDING_REVIEW', // chờ review
  IN_REVIEW: 'IN_REVIEW', // đang review
  REJECT_REQUESTED: 'REJECT_REQUESTED', // đề nghị loại bỏ
  ACCEPTED: 'ACCEPTED', // đã chấp nhận
} as const;

export type ArticleStatusType = typeof ArticleStatus[keyof typeof ArticleStatus];