import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { commentService } from '../services/comment.service';
import { useBasicToast, getApiSuccessMessage, getApiErrorMessage } from './useBasicToast';
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
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã thêm nhận xét.'));
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      error(getApiErrorMessage(err, 'Không thể thêm nhận xét.'));
    },
  });
};

export const useReplyComment = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: string; data: CommentReplyRequestDto }) =>
      commentService.reply(threadId, data),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã phản hồi nhận xét.'));
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      error(getApiErrorMessage(err, 'Không thể phản hồi nhận xét.'));
    },
  });
};

export const useUpdateCommentStatus = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: string; data: CommentStatusUpdateRequestDto }) =>
      commentService.updateStatus(threadId, data),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã cập nhật trạng thái nhận xét.'));
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      error(getApiErrorMessage(err, 'Không thể cập nhật trạng thái nhận xét.'));
    },
  });
};

export const useDeleteComment = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string }) => commentService.deleteComment(commentId),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã xoá nhận xét.'));
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      error(getApiErrorMessage(err, 'Không thể xoá nhận xét.'));
    },
  });
};
