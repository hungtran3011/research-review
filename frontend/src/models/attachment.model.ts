import type { AttachmentKindType } from '../constants/attachment-kind';
import type { AttachmentStatusType } from '../constants/attachment-status';

export interface AttachmentDto {
  id: string;
  articleId: string;
  version: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum?: string;
  kind: AttachmentKindType;
  status: AttachmentStatusType;
  createdAt?: string;
  createdBy?: string;
}

export interface AttachmentUploadRequestDto {
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  kind: AttachmentKindType;
}

export interface AttachmentUploadResponseDto {
  attachmentId: string;
  uploadUrl: string;
  s3Key: string;
  expiresAt: string;
}

export interface AttachmentFinalizeRequestDto {
  checksum: string;
}
