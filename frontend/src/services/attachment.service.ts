import { api } from './api';
import { AttachmentKind } from '../constants/attachment-kind';
import type {
  AttachmentDto,
  AttachmentFinalizeRequestDto,
  AttachmentUploadRequestDto,
  AttachmentUploadResponseDto,
  BaseResponseDto,
} from '../models';

export const attachmentService = {
  requestUploadSlot: async (
    articleId: string,
    payload: AttachmentUploadRequestDto,
  ): Promise<BaseResponseDto<AttachmentUploadResponseDto>> => {
    const response = await api.post<BaseResponseDto<AttachmentUploadResponseDto>>(
      `/articles/${articleId}/attachments/upload-slot`,
      payload,
    );
    return response.data;
  },
  finalizeUpload: async (
    attachmentId: string,
    payload: AttachmentFinalizeRequestDto,
  ): Promise<BaseResponseDto<AttachmentDto>> => {
    const response = await api.post<BaseResponseDto<AttachmentDto>>(
      `/attachments/${attachmentId}/finalize`,
      payload,
    );
    return response.data;
  },
  uploadFile: async (
    articleId: string,
    file: File,
    options?: { version?: number; kind?: string },
  ): Promise<BaseResponseDto<AttachmentDto>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', String(options?.version ?? 1));
    formData.append('kind', options?.kind ?? AttachmentKind.SUBMISSION);

    const response = await api.post<BaseResponseDto<AttachmentDto>>(
      `/articles/${articleId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },
  listArticleAttachments: async (
    articleId: string,
    version?: number,
  ): Promise<BaseResponseDto<AttachmentDto[]>> => {
    const response = await api.get<BaseResponseDto<AttachmentDto[]>>(
      `/articles/${articleId}/attachments`,
      {
        params: version != null ? { version } : undefined,
      },
    )
    return response.data
  },
  downloadUrl: async (attachmentId: string): Promise<BaseResponseDto<string>> => {
    const response = await api.get<BaseResponseDto<string>>(`/attachments/${attachmentId}/download-url`)
    return response.data
  }
};
