import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { structuredReviewService } from '../services/structured-review.service'
import { useBasicToast, getApiSuccessMessage, getApiErrorMessage } from './useBasicToast'
import type {
  BaseResponseDto,
  StructuredReviewAnonymizedDto,
  StructuredReviewDto,
  StructuredReviewSubmitRequestDto,
} from '../models'

export const useMyStructuredReview = (articleId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['structuredReview', 'me', articleId],
    queryFn: () => structuredReviewService.getMyReview(articleId as string),
    enabled: enabled && !!articleId,
  })
}

export const useAnonymizedStructuredReviews = (articleId?: string, enabled: boolean = true) => {
  return useQuery<BaseResponseDto<StructuredReviewAnonymizedDto[]>>({
    queryKey: ['structuredReview', 'anonymized', articleId],
    queryFn: () => structuredReviewService.getAnonymized(articleId as string),
    enabled: enabled && !!articleId,
  })
}

export const useEditorStructuredReviews = (articleId?: string, enabled: boolean = true) => {
  return useQuery<BaseResponseDto<StructuredReviewDto[]>>({
    queryKey: ['structuredReview', 'editor', articleId],
    queryFn: () => structuredReviewService.getEditorView(articleId as string),
    enabled: enabled && !!articleId,
  })
}

export const useChairStructuredReviews = (articleId?: string, enabled: boolean = true) => {
  return useEditorStructuredReviews(articleId, enabled)
}

export const useSubmitStructuredReview = (articleId: string) => {
  const queryClient = useQueryClient()
  const { success, error } = useBasicToast()

  return useMutation({
    mutationFn: (data: StructuredReviewSubmitRequestDto) =>
      structuredReviewService.saveOrSubmit(articleId, data),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Đã gửi phản biện cấu trúc.'))
      queryClient.invalidateQueries({ queryKey: ['article', articleId] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['structuredReview', 'me', articleId] })
      queryClient.invalidateQueries({ queryKey: ['structuredReview', 'anonymized', articleId] })
      queryClient.invalidateQueries({ queryKey: ['structuredReview', 'editor', articleId] })
      queryClient.invalidateQueries({ queryKey: ['structuredReview', 'chair', articleId] })
    },
    onError: (err: AxiosError<BaseResponseDto<StructuredReviewDto>>) => {
      error(getApiErrorMessage(err, 'Không thể gửi phản biện cấu trúc.'))
    },
  })
}
