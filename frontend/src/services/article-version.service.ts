import { api } from './api'
import type {
  ArticleVersionCreateRequestDto,
  ArticleVersionDto,
  BaseResponseDto,
  VersionSupplementAttachRequestDto,
  VersionSupplementDto,
} from '../models'

export const articleVersionService = {
  createVersion: async (
    articleId: string,
    payload: ArticleVersionCreateRequestDto,
  ): Promise<BaseResponseDto<ArticleVersionDto>> => {
    const response = await api.post<BaseResponseDto<ArticleVersionDto>>(
      `/articles/${articleId}/versions`,
      payload,
    )
    return response.data
  },

  listVersions: async (articleId: string): Promise<BaseResponseDto<ArticleVersionDto[]>> => {
    const response = await api.get<BaseResponseDto<ArticleVersionDto[]>>(
      `/articles/${articleId}/versions`,
    )
    return response.data
  },

  attachSupplement: async (
    articleId: string,
    version: number,
    payload: VersionSupplementAttachRequestDto,
  ): Promise<BaseResponseDto<ArticleVersionDto>> => {
    const response = await api.post<BaseResponseDto<ArticleVersionDto>>(
      `/articles/${articleId}/versions/${version}/attachments`,
      payload,
    )
    return response.data
  },

  listSupplements: async (
    articleId: string,
    version: number,
  ): Promise<BaseResponseDto<VersionSupplementDto[]>> => {
    const response = await api.get<BaseResponseDto<VersionSupplementDto[]>>(
      `/articles/${articleId}/versions/${version}/supplements`,
    )
    return response.data
  },

  mainDownloadUrl: async (
    articleId: string,
    version: number,
  ): Promise<BaseResponseDto<string>> => {
    const response = await api.get<BaseResponseDto<string>>(
      `/articles/${articleId}/versions/${version}/main/download-url`,
    )
    return response.data
  },

  supplementDownloadUrl: async (
    articleId: string,
    version: number,
    attachmentId: string,
  ): Promise<BaseResponseDto<string>> => {
    const response = await api.get<BaseResponseDto<string>>(
      `/articles/${articleId}/versions/${version}/supplements/${attachmentId}/download-url`,
    )
    return response.data
  },

  downloadMainFile: async (articleId: string, version: number): Promise<Blob> => {
    const response = await api.get(`/articles/${articleId}/pdf`, {
      params: { version },
      responseType: 'blob',
    })
    return response.data as Blob
  },

  downloadSupplementFile: async (attachmentId: string): Promise<Blob> => {
    const response = await api.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    })
    return response.data as Blob
  },
}
