import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { articleService } from '../services/article.service';
import { useBusinessToast } from './businessToast';
import { ArticleBusinessCode } from '../constants/business-code';
import type {
  ArticleRequestDto,
  BaseResponseDto,
  InitialReviewRequestDto,
  ArticleDto,
} from '../models';

export const useArticles = (page: number = 0, size: number = 10) => {
  return useQuery({
    queryKey: ['articles', page, size],
    queryFn: () => articleService.list(page, size),
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
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: (data: ArticleRequestDto) => articleService.create(data),
    onSuccess: (response) => {
      showSuccess(response, 'Nộp bài báo thành công!', [ArticleBusinessCode.ARTICLE_CREATED_SUCCESSFULLY]);
      const articleId = response.data?.id;
      if (articleId) {
        navigate(`/articles/${articleId}`);
      } else {
        navigate('/');
      }
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Không thể nộp bài báo. Vui lòng thử lại.');
    },
  });
};

export const useInitialReview = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: (data: InitialReviewRequestDto) => articleService.initialReview(articleId, data),
    onSuccess: (response) => {
      showSuccess(response, 'Đã ghi nhận đánh giá ban đầu.', [ArticleBusinessCode.ARTICLE_STATUS_UPDATED, ArticleBusinessCode.ARTICLE_UPDATED_SUCCESSFULLY]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      showErrorFromAxios(err, 'Không thể cập nhật đánh giá ban đầu.');
    },
  });
};

export const useUpdateArticleLink = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: (link: string) => articleService.updateLink(articleId, link),
    onSuccess: (response) => {
      showSuccess(response, 'Đã cập nhật liên kết tài liệu.', [ArticleBusinessCode.ARTICLE_UPDATED_SUCCESSFULLY]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      showErrorFromAxios(err, 'Không thể cập nhật liên kết tài liệu.');
    },
  });
};

export const useRequestReviewApprove = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: () => articleService.requestReviewApprove(articleId),
    onSuccess: (response) => {
      showSuccess(response, 'Đã gửi đề nghị chấp thuận.', [ArticleBusinessCode.ARTICLE_STATUS_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      showErrorFromAxios(err, 'Không thể gửi đề nghị chấp thuận.');
    },
  });
};

export const useRequestReviewReject = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: () => articleService.requestReviewReject(articleId),
    onSuccess: (response) => {
      showSuccess(response, 'Đã gửi yêu cầu loại bỏ.', [ArticleBusinessCode.ARTICLE_STATUS_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      showErrorFromAxios(err, 'Không thể gửi yêu cầu loại bỏ.');
    },
  });
};

export const useRequestRevisions = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: () => articleService.requestRevisions(articleId),
    onSuccess: (response) => {
      showSuccess(response, 'Đã gửi yêu cầu sửa chữa.', [ArticleBusinessCode.ARTICLE_STATUS_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      showErrorFromAxios(err, 'Không thể gửi yêu cầu sửa chữa.');
    },
  });
};

export const useStartRevisions = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: () => articleService.startRevisions(articleId),
    onSuccess: (response) => {
      showSuccess(response, 'Đã bắt đầu sửa chữa.', [ArticleBusinessCode.ARTICLE_STATUS_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      showErrorFromAxios(err, 'Không thể bắt đầu sửa chữa.');
    },
  });
};

export const useEditorApproveArticle = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: () => articleService.approve(articleId),
    onSuccess: (response) => {
      showSuccess(response, 'Đã chấp thuận bài báo.', [ArticleBusinessCode.ARTICLE_STATUS_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Không thể chấp thuận bài báo.');
    },
  });
};

export const useEditorRejectArticle = (articleId: string) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: () => articleService.reject(articleId),
    onSuccess: (response) => {
      showSuccess(response, 'Đã từ chối bài báo.', [ArticleBusinessCode.ARTICLE_STATUS_UPDATED]);
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Không thể từ chối bài báo.');
    },
  });
};
