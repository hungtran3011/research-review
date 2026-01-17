import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { commentService } from '../services/comment.service';
import { useBusinessToast } from './businessToast';
import { CommentBusinessCode } from '../constants/business-code';
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
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: (data: CommentCreateRequestDto) => commentService.create(articleId, data),
    onSuccess: (response) => {
      showSuccess(response, 'Đã thêm nhận xét.', [CommentBusinessCode.COMMENT_THREAD_CREATED, CommentBusinessCode.COMMENT_THREAD_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      showErrorFromAxios(err, 'Không thể thêm nhận xét.');
    },
  });
};

export const useReplyComment = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: string; data: CommentReplyRequestDto }) =>
      commentService.reply(threadId, data),
    onSuccess: (response) => {
      showSuccess(response, 'Đã phản hồi nhận xét.', [CommentBusinessCode.COMMENT_THREAD_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      showErrorFromAxios(err, 'Không thể phản hồi nhận xét.');
    },
  });
};

export const useUpdateCommentStatus = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: string; data: CommentStatusUpdateRequestDto }) =>
      commentService.updateStatus(threadId, data),
    onSuccess: (response) => {
      showSuccess(response, 'Đã cập nhật trạng thái nhận xét.', [CommentBusinessCode.COMMENT_THREAD_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<CommentThreadDto>>) => {
      showErrorFromAxios(err, 'Không thể cập nhật trạng thái nhận xét.');
    },
  });
};
