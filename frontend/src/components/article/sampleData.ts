// Sample data for testing the ReviewArticle component
import type { ArticleVersionDto, CommentDto, ArticleSubmissionDto } from '../../models'

export const sampleVersions: ArticleVersionDto[] = [
    {
        version: 1,
        fileUrl: '/sample-papers/ArchiMate-Cookbook.pdf',
        uploadedAt: new Date('2025-01-15'),
        uploadedBy: 'Dr. John Smith'
    },
    {
        version: 2,
        fileUrl: '/sample-papers/Trần Quang Hưng - SE.pdf',
        uploadedAt: new Date('2025-02-10'),
        uploadedBy: 'Dr. John Smith'
    },
    {
        version: 3,
        fileUrl: '/sample-papers/test-no-toc.pdf',
        uploadedAt: new Date('2025-03-05'),
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
        version: 1,
        pageNumber: 3,
        position: { x: 20, y: 30 },
        selectedText: 'The methodology section lacks detail on sample selection',
        content: 'Please provide more information about the sampling methodology, including sample size calculation and selection criteria.',
        author: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: new Date('2025-01-20'),
        status: 'addressed' as const,
        section: 'Methodology'
    },
    {
        id: '2',
        version: 1,
        pageNumber: 7,
        position: { x: 45, y: 50 },
        selectedText: 'Results show significant correlation',
        content: 'Consider adding a discussion about potential confounding variables that might affect these results.',
        author: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: new Date('2025-01-22'),
        status: 'resolved' as const,
        section: 'Results'
    },
    {
        id: '3',
        version: 2,
        pageNumber: 3,
        content: 'The revised methodology section is much clearer now. Thank you for the additions.',
        author: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: new Date('2025-02-12'),
        status: 'resolved' as const,
        section: 'Methodology'
    },
    {
        id: '4',
        version: 3,
        pageNumber: 10,
        position: { x: 30, y: 40 },
        selectedText: 'limitations of this study include',
        content: 'This limitation is significant. Consider expanding the discussion on how future research could address this.',
        author: 'Dr. Jane Reviewer',
        authorId: 'reviewer-1',
        createdAt: new Date('2025-03-08'),
        status: 'open' as const,
        section: 'Discussion'
    },
    {
        id: '5',
        version: 3,
        pageNumber: 12,
        content: 'The conclusion section needs to be more concise. Consider summarizing the key findings in a bullet list.',
        author: 'Prof. Mike Reviewer',
        authorId: 'reviewer-2',
        createdAt: new Date('2025-03-09'),
        status: 'open' as const,
        section: 'Conclusion'
    }
]
