import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import { Typography } from 'antd'
import ArticleDetails from './ArticleDetails'
import ReviewArticle from './ReviewArticle'
import EditorInitialReview from './EditorInitialReview'
import { useCurrentUser } from '../../hooks/useUser'
import { useArticle } from '../../hooks/useArticles'
import { useAuthStore } from '../../stores/authStore'
import { ArticleStatus } from '../../constants'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

function ArticleWorkspace() {
    const params = useParams<{ articleId: string }>()
    const { t } = useTranslation()
    const articleId = params.articleId

    const { data: currentUserData, isLoading: isUserLoading } = useCurrentUser()
    const currentUser = currentUserData?.data
    const currentUserEmail = useAuthStore((s) => s.email)

    const { data: articleResponse, isLoading: isArticleLoading } = useArticle(articleId, !!articleId)
    const article = articleResponse?.data

    const currentConferenceRoles = useMemo(() => {
        if (!article?.conferenceId || !currentUser?.conferences) return []
        return currentUser.conferences
            .filter((membership) => membership.conferenceId === article.conferenceId)
            .map((membership) => membership.membershipRole)
    }, [article?.conferenceId, currentUser?.conferences])

    const isAssignedReviewer = useMemo(() => {
        if (!article) return false
        const currentUserId = (currentUser as { id?: string } | undefined)?.id
        return (article.reviewers ?? []).some((reviewer: { user?: { id?: string } | null; email?: string | null }) => {
            const matchesUserId = !!reviewer.user?.id && !!currentUserId && reviewer.user.id === currentUserId
            const matchesEmail = !!reviewer.email && !!currentUserEmail && reviewer.email.toLowerCase() === currentUserEmail.toLowerCase()
            return matchesUserId || matchesEmail
        })
    }, [article, currentUser, currentUserEmail])

    const isAdmin = currentUser?.globalRole === 'ADMIN'
    const isEditor = useMemo(() => isAdmin || currentConferenceRoles.includes('EDITOR'), [isAdmin, currentConferenceRoles])
    const isReviewer = useMemo(() => currentConferenceRoles.includes('REVIEWER'), [currentConferenceRoles])

    const canShowInitialReviewPanel = isEditor && article?.status === ArticleStatus.SUBMITTED
    const canShowReviewerPanel = isReviewer && isAssignedReviewer

    useEffect(() => {
        const title = canShowInitialReviewPanel
            ? t('articleDetails.initialReview')
            : canShowReviewerPanel
                ? t('reviewArticle.title')
                : t('articleWorkspace.pageTitle')
        document.title = `${title} - Research Review`
    }, [canShowInitialReviewPanel, canShowReviewerPanel, t])

    if (!articleId) {
        return <div style={{ padding: 24 }}><Text>{t('articleWorkspace.notFound')}</Text></div>
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)' }}>
            {isUserLoading || isArticleLoading ? (
                <div style={{ padding: 24 }}>
                    <Text>{t('articleWorkspace.loading')}</Text>
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
