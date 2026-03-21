// Sample data for testing the ReviewArticle component
import type { ArticleVersionDto, CommentDto, ArticleSubmissionDto } from '../../models'

export const sampleVersions: ArticleVersionDto[] = [
    {
        version: 1,
        fileUrl: '/sample-papers/ArchiMate-Cookbook.pdf',
        uploadedAt: '2025-01-15T00:00:00.000Z',
        uploadedBy: 'Dr. John Smith'
    },
    {
        version: 2,
        fileUrl: '/sample-papers/Trần Quang Hưng - SE.pdf',
        uploadedAt: '2025-02-10T00:00:00.000Z',
        uploadedBy: 'Dr. John Smith'
    },
    {
        version: 3,
        fileUrl: '/sample-papers/test-no-toc.pdf',
        uploadedAt: '2025-03-05T00:00:00.000Z',
        uploadedBy: 'Dr. John Smith'
    }
]

// Sample article for editor initial review
export const sampleArticleSubmission: ArticleSubmissionDto = {
    id: 'article-123',
    title: 'Machine Learning Applications in Healthcare: A Comprehensive Study',
    abstract: 'This study explores the applications of machine learning in modern healthcare systems...',
    authors: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'],
    submittedDate: new Date('2025-03-01'),
    fileUrl: '/sample-papers/ArchiMate-Cookbook.pdf'
}

export const sampleComments: CommentDto[] = [
    {
        id: '1',
        content: 'Please provide more information about the sampling methodology, including sample size calculation and selection criteria.',
        authorName: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: '2025-01-20T00:00:00.000Z'
    },
    {
        id: '2',
        content: 'Consider adding a discussion about potential confounding variables that might affect these results.',
        authorName: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: '2025-01-22T00:00:00.000Z'
    },
    {
        id: '3',
        content: 'The revised methodology section is much clearer now. Thank you for the additions.',
        authorName: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: '2025-02-12T00:00:00.000Z'
    },
    {
        id: '4',
        content: 'This limitation is significant. Consider expanding the discussion on how future research could address this.',
        authorName: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: '2025-03-08T00:00:00.000Z'
    },
    {
        id: '5',
        content: 'The conclusion section needs to be more concise. Consider summarizing the key findings in a bullet list.',
        authorName: 'Prof. Mike Reviewer',
        authorId: 'reviewer-2',
        createdAt: '2025-03-09T00:00:00.000Z'
    }
]
