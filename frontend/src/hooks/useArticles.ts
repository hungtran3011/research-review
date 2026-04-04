import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { articleService } from '../services/article.service';
import { submissionMetadataService } from '../services/submission-metadata.service';
import { useBasicToast, getApiSuccessMessage, getApiErrorMessage } from './useBasicToast';
import type {
  ArticleListFilterDto,
  ArticleRequestDto,
  BaseResponseDto,
  InitialReviewRequestDto,
  ArticleDto,
} from '../models';

export const useArticles = (
  page: number = 0,
  size: number = 10,
  enabled: boolean = true,
  filters?: ArticleListFilterDto,
) => {
  return useQuery({
    queryKey: ['articles', page, size, filters?.title ?? '', filters?.author ?? '', filters?.status ?? ''],
    queryFn: () => articleService.list(page, size, filters),
    enabled,
  });
};

export const useArticleDashboardStats = (enabled: boolean = true, filters?: ArticleListFilterDto) => {
  return useQuery({
    queryKey: ['article-dashboard-stats', filters?.title ?? '', filters?.author ?? '', filters?.status ?? ''],
    queryFn: () => articleService.dashboardStats(filters),
    enabled,
  });
};

export const useSubmissionMetadata = () => {
  return useQuery({
    queryKey: ['submission-metadata'],
    queryFn: () => submissionMetadataService.get(),
  });
};

export const useArticle = (id?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => articleService.getById(id as string),
    enabled: enabled && !!id,
  });
};

export const useSubmitArticle = () => {
  const navigate = useNavigate();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (data: ArticleRequestDto) => articleService.create(data),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Nộp bài báo thành công!'));
      const articleId = response.data?.id;
      if (articleId) {
        navigate(`/articles/${articleId}`);
      } else {
        navigate('/');
      }
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      error(getApiErrorMessage(err, 'Không thể nộp bài báo. Vui lòng thử lại.'));
    },
  });
};

export const useInitialReview = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (data: InitialReviewRequestDto) => articleService.initialReview(articleId, data),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã ghi nhận đánh giá ban đầu.'));
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      error(getApiErrorMessage(err, 'Không thể cập nhật đánh giá ban đầu.'));
    },
  });
};

export const useUpdateArticleLink = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (link: string) => articleService.updateLink(articleId, link),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã cập nhật liên kết tài liệu.'));
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      error(getApiErrorMessage(err, 'Không thể cập nhật liên kết tài liệu.'));
    },
  });
};

export const useRequestRevisions = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: () => articleService.requestRevisions(articleId),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã gửi yêu cầu sửa chữa.'));
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      error(getApiErrorMessage(err, 'Không thể gửi yêu cầu sửa chữa.'));
    },
  });
};

export const useMarkReviewsCompleted = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: () => articleService.markReviewsCompleted(articleId),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã chuyển bài báo sang trạng thái hoàn tất phản biện.'));
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      error(getApiErrorMessage(err, 'Không thể cập nhật trạng thái hoàn tất phản biện.'));
    },
  });
};

export const useStartRevisions = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: () => articleService.startRevisions(articleId),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã bắt đầu sửa chữa.'));
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      error(getApiErrorMessage(err, 'Không thể bắt đầu sửa chữa.'));
    },
  });
};

export const useEditorApproveArticle = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: () => articleService.approve(articleId),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã chấp thuận bài báo.'));
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      error(getApiErrorMessage(err, 'Không thể chấp thuận bài báo.'));
    },
  });
};

export const useEditorRejectArticle = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: () => articleService.reject(articleId),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã từ chối bài báo.'));
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      error(getApiErrorMessage(err, 'Không thể từ chối bài báo.'));
    },
  });
};
