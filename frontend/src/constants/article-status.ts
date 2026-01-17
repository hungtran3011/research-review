export const ArticleStatus = {
  SUBMITTED: 'SUBMITTED', // Chờ xử lý
  REJECTED: 'REJECTED', // Bị từ chối
  PENDING_REVIEW: 'PENDING_REVIEW', // chờ review
  IN_REVIEW: 'IN_REVIEW', // đang review
  REVISIONS_REQUESTED: 'REVISIONS_REQUESTED', // yêu cầu sửa chữa
  REVISIONS: 'REVISIONS', // đang sửa chữa
  REJECT_REQUESTED: 'REJECT_REQUESTED', // đề nghị loại bỏ
  ACCEPT_REQUESTED: 'ACCEPT_REQUESTED', // đề nghị chấp thuận
  ACCEPTED: 'ACCEPTED', // đã chấp nhận
} as const;

export type ArticleStatusType = typeof ArticleStatus[keyof typeof ArticleStatus];