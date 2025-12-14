import { api } from './api';
import type {
  BaseResponseDto,
  CommentCreateRequestDto,
  CommentReplyRequestDto,
  CommentStatusUpdateRequestDto,
  CommentThreadDto,
} from '../models';

export const commentService = {
  list: async (articleId: string): Promise<BaseResponseDto<CommentThreadDto[]>> => {
    const response = await api.get<BaseResponseDto<CommentThreadDto[]>>(
      `/articles/${articleId}/comments`,
    );
    return response.data;
  },
  create: async (
    articleId: string,
    data: CommentCreateRequestDto,
  ): Promise<BaseResponseDto<CommentThreadDto>> => {
    const response = await api.post<BaseResponseDto<CommentThreadDto>>(
      `/articles/${articleId}/comments`,
      data,
    );
    return response.data;
  },
  reply: async (
    threadId: string,
    data: CommentReplyRequestDto,
  ): Promise<BaseResponseDto<CommentThreadDto>> => {
    const response = await api.post<BaseResponseDto<CommentThreadDto>>(
      `/comments/${threadId}/replies`,
      data,
    );
    return response.data;
  },
  updateStatus: async (
    threadId: string,
    data: CommentStatusUpdateRequestDto,
  ): Promise<BaseResponseDto<CommentThreadDto>> => {
    const response = await api.patch<BaseResponseDto<CommentThreadDto>>(
      `/comments/${threadId}/status`,
      data,
    );
    return response.data;
  },
};
