import { api } from './api';
import type {
  ArticleDto,
  ArticleRequestDto,
  BaseResponseDto,
  InitialReviewRequestDto,
  PageResponseDto,
} from '../models';

export const articleService = {
  list: async (
    page: number = 0,
    size: number = 10,
  ): Promise<BaseResponseDto<PageResponseDto<ArticleDto>>> => {
    const response = await api.get<BaseResponseDto<PageResponseDto<ArticleDto>>>(
      '/articles',
      { params: { page, size } },
    );
    return response.data;
  },
  getById: async (id: string): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.get<BaseResponseDto<ArticleDto>>(`/articles/${id}`);
    return response.data;
  },
  create: async (data: ArticleRequestDto): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.post<BaseResponseDto<ArticleDto>>('/articles', data);
    return response.data;
  },
  initialReview: async (
    id: string,
    data: InitialReviewRequestDto,
  ): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.post<BaseResponseDto<ArticleDto>>(
      `/articles/${id}/initial-review`,
      data,
    );
    return response.data;
  },
  updateLink: async (id: string, link: string): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.put<BaseResponseDto<ArticleDto>>(`/articles/${id}/link`, {
      link,
    });
    return response.data;
  },
};
