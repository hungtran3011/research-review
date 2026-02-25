import { api } from './api';
import type { BaseResponseDto } from '../models';
import type { ArticleStatusType } from '../constants/article-status';

export interface ReviewerInviteDecisionDto {
  articleId: string;
  articleStatus: ArticleStatusType;
  reviewerStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';
}

export interface ReviewerInviteResolveDto {
  email: string;
  articleId: string;
  articleTitle: string;
  trackName: string;
  authors: string[];
}

export const reviewerInviteService = {
  resolve: async (token: string): Promise<BaseResponseDto<ReviewerInviteResolveDto>> => {
    const response = await api.get<BaseResponseDto<ReviewerInviteResolveDto>>('/reviewer-invites/resolve', {
      params: { token },
    });
    return response.data;
  },

  accept: async (token: string): Promise<BaseResponseDto<ReviewerInviteDecisionDto>> => {
    const response = await api.post<BaseResponseDto<ReviewerInviteDecisionDto>>('/reviewer-invites/accept', null, {
      params: { token },
    });
    return response.data;
  },

  decline: async (token: string): Promise<BaseResponseDto<ReviewerInviteDecisionDto>> => {
    const response = await api.post<BaseResponseDto<ReviewerInviteDecisionDto>>('/reviewer-invites/decline', null, {
      params: { token },
    });
    return response.data;
  },
};
