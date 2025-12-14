import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { articleService } from '../services/article.service';
import { useBasicToast } from './useBasicToast';
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
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (data: ArticleRequestDto) => articleService.create(data),
    onSuccess: (response) => {
      success('Nộp bài báo thành công!');
      const articleId = response.data?.id;
      if (articleId) {
        navigate(`/articles/${articleId}`);
      } else {
        navigate('/');
      }
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      const message = err.response?.data?.message || 'Không thể nộp bài báo. Vui lòng thử lại.';
      error(message);
    },
  });
};

export const useInitialReview = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (data: InitialReviewRequestDto) => articleService.initialReview(articleId, data),
    onSuccess: () => {
      success('Đã ghi nhận đánh giá ban đầu.');
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      const message = err.response?.data?.message || 'Không thể cập nhật đánh giá ban đầu.';
      error(message);
    },
  });
};

export const useUpdateArticleLink = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (link: string) => articleService.updateLink(articleId, link),
    onSuccess: () => {
      success('Đã cập nhật liên kết tài liệu.');
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: AxiosError<BaseResponseDto<ArticleDto>>) => {
      const message = err.response?.data?.message || 'Không thể cập nhật liên kết tài liệu.';
      error(message);
    },
  });
};
