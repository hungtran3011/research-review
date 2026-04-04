import type { AttachmentKindType } from '../constants/attachment-kind'
import type { AttachmentStatusType } from '../constants/attachment-status'

export interface VersionSupplementDto {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  kind: AttachmentKindType
  status: AttachmentStatusType
  createdAt: string
  createdBy: string
}

export interface ArticleVersionDto {
  id: string
  articleId: string
  versionNumber: number
  submittedAt?: string
  submittedBy?: string
  mainAttachment?: VersionSupplementDto
  supplements: VersionSupplementDto[]
  version?: number
  fileUrl?: string | null
  uploadedAt?: string
  uploadedBy?: string
}

export interface ArticleVersionCreateRequestDto {
  versionNumber: number
  mainAttachmentId?: string
}

export interface VersionSupplementAttachRequestDto {
  attachmentId: string
}
