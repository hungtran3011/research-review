import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { commentService } from '../services/comment.service';
import { useBasicToast } from './useBasicToast';
import type {
  BaseResponseDto,
  CommentCreateRequestDto,
  CommentReplyRequestDto,
  CommentStatusUpdateRequestDto,
  CommentThreadDto,
} from '../models';

export const useArticleComments = (articleId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['article-comments', articleId],
    queryFn: () => commentService.list(articleId as string),
    enabled: enabled && !!articleId,
  });
};

export const useCreateComment = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (data: CommentCreateRequestDto) => commentService.create(articleId, data),
    onSuccess: () => {
      success('Đã thêm nhận xét.');
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      const message = err.response?.data?.message || 'Không thể thêm nhận xét.';
      error(message);
    },
  });
};

export const useReplyComment = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: string; data: CommentReplyRequestDto }) =>
      commentService.reply(threadId, data),
    onSuccess: () => {
      success('Đã phản hồi nhận xét.');
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      const message = err.response?.data?.message || 'Không thể phản hồi nhận xét.';
      error(message);
    },
  });
};

export const useUpdateCommentStatus = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: string; data: CommentStatusUpdateRequestDto }) =>
      commentService.updateStatus(threadId, data),
    onSuccess: () => {
      success('Đã cập nhật trạng thái nhận xét.');
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      const message = err.response?.data?.message || 'Không thể cập nhật trạng thái nhận xét.';
      error(message);
    },
  });
};
