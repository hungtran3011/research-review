import { useMemo } from 'react'
import { useParams } from 'react-router'
import { Text } from '@fluentui/react-components'
import ArticleDetails from './ArticleDetails'
import ReviewArticle from './ReviewArticle'
import EditorInitialReview from './EditorInitialReview'
import { useCurrentUser } from '../../hooks/useUser'
import { useArticle } from '../../hooks/useArticles'
import { useAuthStore } from '../../stores/authStore'
import { ArticleStatus } from '../../constants'

function ArticleWorkspace() {
    const params = useParams<{ articleId: string }>()
    const articleId = params.articleId

    const { data: currentUserData, isLoading: isUserLoading } = useCurrentUser()
    const currentUser = currentUserData?.data
    const currentUserEmail = useAuthStore((s) => s.email)

    const { data: articleResponse, isLoading: isArticleLoading } = useArticle(articleId, !!articleId)
    const article = articleResponse?.data

    const currentRoles = useMemo(() => {
        const roles = (currentUser as { roles?: string[] } | undefined)?.roles
        if (Array.isArray(roles) && roles.length > 0) return roles
        const role = (currentUser as { role?: string } | undefined)?.role
        return role ? [role] : []
    }, [currentUser])

    const isAssignedReviewer = useMemo(() => {
        if (!article) return false
        const currentUserId = (currentUser as { id?: string } | undefined)?.id
        return (article.reviewers ?? []).some((reviewer: { user?: { id?: string } | null; email?: string | null }) => {
            const matchesUserId = !!reviewer.user?.id && !!currentUserId && reviewer.user.id === currentUserId
            const matchesEmail = !!reviewer.email && !!currentUserEmail && reviewer.email.toLowerCase() === currentUserEmail.toLowerCase()
            return matchesUserId || matchesEmail
        })
    }, [article, currentUser, currentUserEmail])

    const isEditor = useMemo(() => currentRoles.includes('EDITOR') || currentRoles.includes('ADMIN'), [currentRoles])
    const isReviewer = useMemo(() => currentRoles.includes('REVIEWER'), [currentRoles])

    const canShowInitialReviewPanel = isEditor && article?.status === ArticleStatus.SUBMITTED
    const canShowReviewerPanel = isReviewer && isAssignedReviewer

    if (!articleId) {
        return <div style={{ padding: 24 }}><Text>Không tìm thấy bài báo.</Text></div>
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)' }}>
            {isUserLoading || isArticleLoading ? (
                <div style={{ padding: 24 }}>
                    <Text>Đang tải...</Text>
                </div>
            ) : canShowInitialReviewPanel ? (
                <EditorInitialReview />
            ) : canShowReviewerPanel ? (
                <ReviewArticle />
            ) : (
                <ArticleDetails />
            )}
        </div>
    )
}

export default ArticleWorkspace
