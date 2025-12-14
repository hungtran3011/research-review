export const AttachmentStatus = {
  PENDING_UPLOAD: 'PENDING_UPLOAD',
  AVAILABLE: 'AVAILABLE',
  DELETED: 'DELETED',
} as const;

export type AttachmentStatusType = typeof AttachmentStatus[keyof typeof AttachmentStatus];
