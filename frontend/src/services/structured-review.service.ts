import { api } from './api'
import type {
  BaseResponseDto,
  StructuredReviewAnonymizedDto,
  StructuredReviewDto,
  StructuredReviewSubmitRequestDto,
} from '../models'

export const structuredReviewService = {
  saveOrSubmit: async (
    articleId: string,
    data: StructuredReviewSubmitRequestDto,
  ): Promise<BaseResponseDto<StructuredReviewDto>> => {
    const response = await api.post<BaseResponseDto<StructuredReviewDto>>(
      `/articles/${articleId}/structured-reviews`,
      data,
    )
    return response.data
  },

  getMyReview: async (articleId: string): Promise<BaseResponseDto<StructuredReviewDto | null>> => {
    const response = await api.get<BaseResponseDto<StructuredReviewDto | null>>(
      `/articles/${articleId}/structured-reviews/me`,
    )
    return response.data
  },

  getAnonymized: async (articleId: string): Promise<BaseResponseDto<StructuredReviewAnonymizedDto[]>> => {
    const response = await api.get<BaseResponseDto<StructuredReviewAnonymizedDto[]>>(
      `/articles/${articleId}/structured-reviews/anonymized`,
    )
    return response.data
  },

  getChairView: async (articleId: string): Promise<BaseResponseDto<StructuredReviewDto[]>> => {
    const response = await api.get<BaseResponseDto<StructuredReviewDto[]>>(
      `/articles/${articleId}/structured-reviews/chair-view`,
    )
    return response.data
  },
}
