import { api } from './api';
import type {
  ArticleDashboardStatsDto,
  ArticleDto,
  ArticleListFilterDto,
  ArticleRequestDto,
  BaseResponseDto,
  InitialReviewRequestDto,
  PageResponseDto,
  ReviewerRequestDto,
  UserDto,
} from '../models';

export const articleService = {
  list: async (
    page: number = 0,
    size: number = 10,
    filters?: ArticleListFilterDto,
  ): Promise<BaseResponseDto<PageResponseDto<ArticleDto>>> => {
    const response = await api.get<BaseResponseDto<PageResponseDto<ArticleDto>>>(
      '/articles',
      {
        params: {
          page,
          size,
          title: filters?.title?.trim() || undefined,
          author: filters?.author?.trim() || undefined,
          status: filters?.status || undefined,
        },
      },
    );
    return response.data;
  },

  dashboardStats: async (
    filters?: ArticleListFilterDto,
  ): Promise<BaseResponseDto<ArticleDashboardStatsDto>> => {
    const response = await api.get<BaseResponseDto<ArticleDashboardStatsDto>>('/articles/dashboard/stats', {
      params: {
        title: filters?.title?.trim() || undefined,
        author: filters?.author?.trim() || undefined,
        status: filters?.status || undefined,
      },
    });
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
  assignReviewer: async (
    id: string,
    reviewer: ReviewerRequestDto
  ): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.post<BaseResponseDto<ArticleDto>>(
      `/articles/${id}/reviewers`,
      reviewer
    );
    return response.data;
  },
  unassignReviewer: async (
    id: string,
    reviewerId: string
  ): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.delete<BaseResponseDto<ArticleDto>>(
      `/articles/${id}/reviewers/${reviewerId}`
    );
    return response.data;
  },
  getReviewerCandidates: async (id: string): Promise<BaseResponseDto<UserDto[]>> => {
    const response = await api.get<BaseResponseDto<UserDto[]>>(`/articles/${id}/reviewer-candidates`);
    return response.data;
  },
  requestRevisions: async (id: string): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.post<BaseResponseDto<ArticleDto>>(
      `/articles/${id}/decision/revisions`,
    );
    return response.data;
  },
  markReviewsCompleted: async (id: string): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.post<BaseResponseDto<ArticleDto>>(
      `/articles/${id}/reviews/completed`,
    );
    return response.data;
  },
  startRevisions: async (id: string): Promise<BaseResponseDto<ArticleDto>> => {
    const response = await api.post<BaseResponseDto<ArticleDto>>(
      `/articles/${id}/revisions/start`,
    );
    return response.data;
  },
  approve: async (id: string): Promise<BaseResponseDto<null>> => {
    const response = await api.post<BaseResponseDto<null>>(
      `/articles/${id}/decision/approve`,
    );
    return response.data;
  },
  reject: async (id: string): Promise<BaseResponseDto<null>> => {
    const response = await api.post<BaseResponseDto<null>>(
      `/articles/${id}/decision/reject`,
    );
    return response.data;
  },
};
