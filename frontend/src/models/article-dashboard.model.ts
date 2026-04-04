import type { ArticleStatusType } from '../constants/article-status'

export interface ArticleDashboardStatsDto {
  total: number
  pending: number
  accepted: number
  rejected: number
}

export interface ArticleListFilterDto {
  title?: string
  author?: string
  status?: ArticleStatusType | ''
}
