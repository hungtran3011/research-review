export interface ArticleSubmissionDto {
  id: string
  title: string
  abstract: string
  authors: string[]
  submittedDate: Date
  fileUrl: string
}
