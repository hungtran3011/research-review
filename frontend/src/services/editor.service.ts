import { api } from './api'
import type { BaseResponseDto, EditorDto, PageResponseDto } from '../models'

export interface EditorRequestDto {
  trackId: string
  userId: string
}

export const editorService = {
  list: async (page: number = 0, size: number = 500): Promise<BaseResponseDto<PageResponseDto<EditorDto>>> => {
    const response = await api.get<BaseResponseDto<PageResponseDto<EditorDto>>>(`/editors/`, {
      params: { page, size },
    })
    return response.data
  },

  create: async (payload: EditorRequestDto): Promise<BaseResponseDto<EditorDto>> => {
    const response = await api.post<BaseResponseDto<EditorDto>>('/editors/', payload)
    return response.data
  },

  delete: async (editorId: string): Promise<BaseResponseDto<unknown>> => {
    const response = await api.delete<BaseResponseDto<unknown>>(`/editors/${editorId}`)
    return response.data
  },
}
