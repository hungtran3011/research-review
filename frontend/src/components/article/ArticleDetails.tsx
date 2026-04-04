import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Button, Typography, Spin, Card, Input, Modal, Tag, Drawer, Select, theme as antdTheme } from 'antd'
import {
    ArrowLeftOutlined,
    FilePdfOutlined,
    UserOutlined,
    CalendarOutlined,
    MenuOutlined,
    CommentOutlined,
    SendOutlined,
    CheckOutlined,
    CloseOutlined,
} from '@ant-design/icons'
import { useArticle, useEditorApproveArticle, useEditorRejectArticle } from '../../hooks/useArticles'
import { useAuthStore } from '../../stores/authStore'
import { useCurrentUser } from '../../hooks/useUser'
import { ArticleStatus } from '../../constants'
import type { ArticleStatusType } from '../../constants'
import { PdfViewer } from '../common/PdfViewer'
import { useArticleComments, useReplyComment } from '../../hooks/useComments'
import { SubmitRevision } from './SubmitRevision'
import { useStartRevisions } from '../../hooks/useArticles'
import { InviteReviewersDialog } from './InviteReviewersDialog'
import { useAnonymizedStructuredReviews, useChairStructuredReviews } from '../../hooks/useStructuredReviews'
import type { ArticleVersionDto, CommentDto, CommentThreadDto, VersionSupplementDto } from '../../models'
import { articleVersionService } from '../../services/article-version.service'
import { useTranslation } from 'react-i18next'

const styles: Record<string, React.CSSProperties> = {
    root: {
        display: 'flex',
        height: 'calc(100vh - 64px)',
        width: '100%',
        overflow: 'hidden',
        flexDirection: 'row',
        position: 'relative',
        background: 'var(--article-bg, transparent)',
    },
    sidebarSection: {
        width: 320,
        flexShrink: 0,
        borderRight: '1px solid var(--article-border-color, #f0f0f0)',
        background: 'var(--article-panel-bg, transparent)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 1002,
    },
    sidebarHidden: {
        transform: 'translateX(-100%)',
    },
    sidebarHeader: {
        padding: 16,
        borderBottom: '1px solid var(--article-border-color, #f0f0f0)',
        background: 'var(--article-panel-bg, transparent)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    sidebarScroll: {
        flex: 1,
        overflow: 'auto',
        padding: 16,
    },
    sectionBlock: { marginBottom: 16 },
    sectionLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 6, color: 'var(--article-text-secondary, inherit)' },
    sectionContent: { fontSize: 14, wordBreak: 'break-word', color: 'var(--article-text, inherit)' },
    metadataRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--article-text-secondary, inherit)' },
    authorsList: { display: 'flex', flexDirection: 'column', gap: 8 },
    authorItem: { padding: 8, borderRadius: 6, fontSize: 13, background: 'var(--article-muted-bg, transparent)' },
    reviewersList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    viewerSection: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
    viewerHeader: { padding: 16, borderBottom: '1px solid var(--article-border-color, #f0f0f0)', background: 'var(--article-panel-bg, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    viewerTitle: { fontSize: 20, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    overlay: { position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'var(--article-overlay-bg, rgba(0,0,0,0.45))' },
    sidebarToggle: { position: 'fixed', bottom: 24, left: 24, zIndex: 1003 },
    centerContent: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' },
    commentsSection: { width: 400, flexShrink: 0, borderLeft: '1px solid var(--article-border-color, #f0f0f0)', background: 'var(--article-panel-bg, transparent)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'transform 0.3s ease-in-out' },
    commentsSectionHidden: { transform: 'translateX(100%)' },
    commentsDialogSurface: { maxWidth: '90vw', width: 520, maxHeight: '90vh' },
    commentsDialogBody: { display: 'flex', flexDirection: 'column', maxHeight: 'calc(90vh - 100px)', overflow: 'hidden' },
    commentsHeader: { padding: 16, borderBottom: '1px solid var(--article-border-color, #f0f0f0)', background: 'var(--article-panel-bg, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    commentsScroll: { flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 },
    commentCard: { padding: 12, width: '100%', alignSelf: 'stretch', flexShrink: 0 },
    commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    commentMeta: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, marginBottom: 8, color: 'var(--article-text-secondary, inherit)' },
    commentContent: { marginBottom: 8 },
    commentReplies: { marginLeft: 16, marginTop: 12, paddingLeft: 12, borderLeft: '2px solid var(--article-border-color, #f0f0f0)', display: 'flex', flexDirection: 'column', gap: 8 },
    replyItem: { padding: 8, borderRadius: 6, background: 'var(--article-muted-bg, transparent)' },
    replyForm: { marginTop: 8, padding: 12, borderRadius: 6, background: 'var(--article-muted-bg, transparent)', display: 'flex', flexDirection: 'column', gap: 8 },
    commentsToggle: { position: 'fixed', bottom: 24, right: 24, zIndex: 1003 },
}

function ArticleDetails() {
    const { t, i18n } = useTranslation('common')
    const { token } = antdTheme.useToken()
    const articleThemeVars = React.useMemo(() => ({
        '--article-bg': token.colorBgLayout,
        '--article-panel-bg': token.colorBgContainer,
        '--article-muted-bg': token.colorFillQuaternary,
        '--article-border-color': token.colorBorderSecondary,
        '--article-overlay-bg': token.colorBgMask,
        '--article-text': token.colorText,
        '--article-text-secondary': token.colorTextSecondary,
        '--article-warning-border': token.colorWarningBorder,
    }) as React.CSSProperties, [token])

    const params = useParams<{ articleId: string }>()
    const navigate = useNavigate()
    const articleId = params.articleId
    const safeArticleId = articleId ?? ''
    const currentUserEmail = useAuthStore((state) => state.email)
    const { data: currentUserData } = useCurrentUser()
    const currentUser = currentUserData?.data
    const currentUserId = currentUser?.id
    const [isSidebarVisible, setIsSidebarVisible] = useState(true)
    const [isCommentsPanelVisible, setIsCommentsPanelVisible] = useState(true)
    const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [showSubmitRevision, setShowSubmitRevision] = useState(false)
    const [versions, setVersions] = useState<ArticleVersionDto[]>([])
    const [currentVersion, setCurrentVersion] = useState<number>(1)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
    const [materialsError, setMaterialsError] = useState<string | null>(null)
    const [downloadingSupplementId, setDownloadingSupplementId] = useState<string | null>(null)
    const { mutate: startRevisions, isPending: isStartingRevisions } = useStartRevisions(safeArticleId)
    const [isInviteReviewersOpen, setIsInviteReviewersOpen] = useState(false)

    const {
        data: articleResponse,
        isLoading,
        isError,
        refetch,
    } = useArticle(articleId, !!articleId)

    const { mutate: approveArticle, isPending: isApproving } = useEditorApproveArticle(safeArticleId)
    const { mutate: rejectArticle, isPending: isRejecting } = useEditorRejectArticle(safeArticleId)

    const {
        data: commentsResponse,
        isLoading: isCommentsLoading,
    } = useArticleComments(articleId, !!articleId)

    const { mutate: replyToComment, isPending: isReplying } = useReplyComment(articleId ?? '')

    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia('(max-width: 1024px)').matches
    })

    useEffect(() => {
        if (typeof window === 'undefined') return
        const media = window.matchMedia('(max-width: 1024px)')

        const handler = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches)
        }

        // Initial sync
        setIsMobile(media.matches)

        // Subscribe
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', handler)
            return () => media.removeEventListener('change', handler)
        }

        // Safari fallback
        media.addListener(handler)
        return () => media.removeListener(handler)
    }, [])

    useEffect(() => {
        if (!isMobile) {
            setIsCommentsDialogOpen(false)
        }
    }, [isMobile])

    const article = articleResponse?.data
    const commentThreads = commentsResponse?.data ?? []
    const dateTimeLocale = i18n.language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'

    useEffect(() => {
        if (!article?.id) return
        let cancelled = false

        void (async () => {
            setIsLoadingMaterials(true)
            setMaterialsError(null)
            try {
                const response = await articleVersionService.listVersions(article.id)
                const loadedVersions = response.data ?? []
                if (cancelled) return
                setVersions(loadedVersions)
                const latestVersion = loadedVersions.length > 0
                    ? Math.max(...loadedVersions.map((versionItem) => versionItem.versionNumber))
                    : 1
                setCurrentVersion(latestVersion)
            } catch (error) {
                if (cancelled) return
                setVersions([])
                setCurrentVersion(1)
                setMaterialsError(error instanceof Error ? error.message : t('articleDetails.loadMaterialsFailed'))
            } finally {
                if (!cancelled) {
                    setIsLoadingMaterials(false)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [article?.id, t])

    useEffect(() => {
        if (!article?.id) return
        let cancelled = false

        void (async () => {
            try {
                const response = await articleVersionService.mainDownloadUrl(article.id, currentVersion)
                if (cancelled) return
                if (response.data) {
                    setPdfUrl(response.data)
                    return
                }
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
                setPdfUrl(`${apiBaseUrl}/articles/${article.id}/pdf?version=${currentVersion}`)
            } catch {
                if (cancelled) return
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
                setPdfUrl(`${apiBaseUrl}/articles/${article.id}/pdf?version=${currentVersion}`)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [article?.id, currentVersion])

    const selectedVersionData = versions.find((versionItem) => versionItem.versionNumber === currentVersion)

    const triggerBrowserDownload = (blob: Blob, fileName: string) => {
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = fileName
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(objectUrl)
    }

    const handleDownloadMain = async () => {
        if (!article?.id) return
        try {
            const blob = await articleVersionService.downloadMainFile(article.id, currentVersion)
            const fileName = selectedVersionData?.mainAttachment?.fileName
                ?? `${article.title || 'article'}-v${currentVersion}.pdf`
            triggerBrowserDownload(blob, fileName)
        } catch (error) {
            console.error('Cannot download main manuscript', error)
        }
    }

    const handleDownloadSupplement = async (supplement: VersionSupplementDto) => {
        if (!article?.id || !supplement.id) return
        setDownloadingSupplementId(supplement.id)
        try {
            const blob = await articleVersionService.downloadSupplementFile(supplement.id)
            triggerBrowserDownload(blob, supplement.fileName)
        } catch (error) {
            console.error('Cannot download supplement', error)
        } finally {
            setDownloadingSupplementId(null)
        }
    }

    const isMyComment = (comment?: CommentDto | null): boolean => {
        if (!comment || !currentUserId) return false
        return comment.createdBy === currentUserId || comment.authorId === currentUserId
    }

    const displayAuthorName = (comment: CommentDto): string => {
        return isMyComment(comment) ? t('articleDetails.you') : comment.authorName
    }

    const getThreadReviewerLabel = (thread: CommentThreadDto): string => {
        // If the latest/first comment is authored by current user, show "Bạn".
        if (thread.comments && thread.comments.length > 0 && isMyComment(thread.comments[0])) {
            return t('articleDetails.you')
        }

        // Prefer stable anonymized label from backend.
        if (thread.reviewerLabel) {
            return thread.reviewerLabel
        }

        // Fallback to displayIndex on article reviewers if available.
        if (thread.reviewerId && article?.reviewers) {
            const reviewer = article.reviewers.find((r) => r.id === thread.reviewerId)
            if (reviewer?.displayIndex != null) {
                return t('articleDetails.reviewerLabel', { index: reviewer.displayIndex })
            }
        }
        return t('articleDetails.reviewer')
    }

    const currentRoles: string[] = (() => {
        const roles = (currentUser as { roles?: string[] } | undefined)?.roles
        if (Array.isArray(roles) && roles.length > 0) return roles
        const role = (currentUser as { role?: string } | undefined)?.role
        return role ? [role] : []
    })()

    const isChair = currentRoles.includes('CHAIR') || currentRoles.includes('ADMIN')
    const canManageReviewers = currentRoles.includes('ADMIN') || currentRoles.includes('EDITOR') || currentRoles.includes('CHAIR')

    const handleReply = (threadId: string) => {
        if (!replyText.trim()) return
        
        replyToComment({
            threadId,
            data: { 
                content: replyText,
                authorName: currentUser?.name ?? currentUserEmail ?? t('articleDetails.user'),
                authorId: currentUser?.id,
            },
        }, {
            onSuccess: () => {
                setReplyText('')
                setReplyingTo(null)
            },
        })
    }

    // Check if current user is an assigned reviewer (match by userId or email)
    const isAssignedReviewer = (article?.reviewers ?? []).some((reviewer) => {
        const matchesUserId = reviewer.user?.id && currentUser?.id && reviewer.user.id === currentUser.id
        const matchesEmail = reviewer.email?.toLowerCase() === (currentUserEmail ?? '').toLowerCase()
        return !!(matchesUserId || matchesEmail)
    })

    const normalizedCurrentEmail = (currentUser?.email ?? currentUserEmail ?? '').trim().toLowerCase()

    // Check if current user is the author of the article
    const isAuthor = article?.authors.some(
        (author) => (author.email ?? '').trim().toLowerCase() === normalizedCurrentEmail
    )

    const { data: chairStructuredReviewsResponse } = useChairStructuredReviews(articleId, !!articleId && isChair)
    const { data: anonymizedStructuredReviewsResponse } = useAnonymizedStructuredReviews(articleId, !!articleId && !!isAuthor)
    const chairStructuredReviews = chairStructuredReviewsResponse?.data ?? []
    const anonymizedStructuredReviews = anonymizedStructuredReviewsResponse?.data ?? []

    const canReplyToComments = !!isAuthor || canManageReviewers

    // Check if current user can submit revision
    const canSubmitRevision =
        !!isAuthor &&
        (article?.status === ArticleStatus.REVISIONS_REQUESTED || article?.status === ArticleStatus.REVISIONS)

    // Check if current user is an editor and article is awaiting initial review
    const canDoInitialReview = canManageReviewers && article?.status === ArticleStatus.SUBMITTED

    const statusLabelMap: Record<ArticleStatusType, { label: string; color: 'brand' | 'informative' | 'important' | 'success' | 'warning' | 'danger' }> = {
        [ArticleStatus.SUBMITTED]: { label: t('notifications.articleStatus.submitted'), color: 'informative' },
        [ArticleStatus.PENDING_REVIEW]: { label: t('notifications.articleStatus.pendingReview'), color: 'informative' },
        [ArticleStatus.IN_REVIEW]: { label: t('notifications.articleStatus.inReview'), color: 'brand' },
        [ArticleStatus.REVIEWS_COMPLETED]: { label: t('notifications.articleStatus.reviewsCompleted'), color: 'brand' },
        [ArticleStatus.REVISIONS_REQUESTED]: { label: t('notifications.articleStatus.revisionsRequested'), color: 'warning' },
        [ArticleStatus.REVISIONS]: { label: t('notifications.articleStatus.revisions'), color: 'important' },
        [ArticleStatus.ACCEPTED]: { label: t('notifications.articleStatus.accepted'), color: 'success' },
        [ArticleStatus.REJECTED]: { label: t('notifications.articleStatus.rejected'), color: 'danger' },
        [ArticleStatus.ACCEPT_REQUESTED]: { label: t('notifications.articleStatus.acceptRequested'), color: 'warning' },
        [ArticleStatus.REJECT_REQUESTED]: { label: t('notifications.articleStatus.rejectRequested'), color: 'warning' },
    }

    // Loading state - center content
    if (isLoading && !article) {
        return (
            <div style={styles.centerContent}>
                <Spin size="large" tip={t('articleDetails.loading')} />
            </div>
        )
    }

    // Error state - center content
    if (isError || !article) {
        return (
            <div style={styles.centerContent}>
                <Typography.Text strong>{t('articleDetails.loadFailed')}</Typography.Text>
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                    style={{ marginTop: 12 }}
                >
                    {t('articleDetails.backHome')}
                </Button>
            </div>
        )
    }

    const statusInfo = statusLabelMap[article.status] || { label: article.status, color: 'informative' as const }

    const reviewSubmissionCount = chairStructuredReviews.length
    const assignedReviewerCount = article.reviewers?.length ?? 0
    const recommendationDistribution = chairStructuredReviews.reduce<Record<string, number>>((accumulator, review) => {
        accumulator[review.recommendation] = (accumulator[review.recommendation] ?? 0) + 1
        return accumulator
    }, {})

    const overallScores = chairStructuredReviews
        .flatMap((review) => review.scores)
        .filter((score) => score.criterion === 'overall')
        .map((score) => score.score)
    const averageOverallScore = overallScores.length > 0
        ? (overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length).toFixed(2)
        : null

    const submittedReviewerDisplayIndices = new Set(
        chairStructuredReviews.map((review) => review.reviewerDisplayIndex)
    )

    const trackName = article.track?.name ?? t('articleDetails.unassigned')
    const submittedDate = article.createdAt
        ? new Date(article.createdAt).toLocaleString(dateTimeLocale)
        : t('articleDetails.notUpdated')

    const renderStructuredReviewPanel = () => {
        if (!isChair && !isAuthor) return null

        if (isChair) {
            return (
                <div style={styles.sectionBlock}>
                    <div style={styles.sectionLabel}>{t('articleDetails.structuredReviewChair')}</div>
                    <Card size="small" style={{ marginBottom: 8 }}>
                        <Typography.Text style={{ display: 'block' }}>
                            {t('articleDetails.reviewProgress', { submitted: reviewSubmissionCount, total: assignedReviewerCount })}
                        </Typography.Text>
                        <Typography.Text style={{ display: 'block' }}>
                            {t('articleDetails.avgOverallScore', { score: averageOverallScore ?? t('articleDetails.notAvailable') })}
                        </Typography.Text>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(recommendationDistribution).length > 0 ? Object.entries(recommendationDistribution).map(([recommendation, count]) => (
                                <Tag key={recommendation}>{recommendation}: {count}</Tag>
                            )) : <Typography.Text type="secondary">{t('articleDetails.noRecommendation')}</Typography.Text>}
                        </div>
                    </Card>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(article.reviewers ?? []).map((reviewer, index) => {
                            const displayIndex = reviewer.displayIndex ?? index + 1
                            const submitted = submittedReviewerDisplayIndices.has(displayIndex)
                            return (
                                <div key={reviewer.id} style={styles.authorItem}>
                                    <Typography.Text>
                                        {t('articleDetails.reviewerStatus', {
                                            index: displayIndex,
                                            status: submitted ? t('articleDetails.submitted') : t('articleDetails.notSubmitted')
                                        })}
                                    </Typography.Text>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        }

        return (
            <div style={styles.sectionBlock}>
                <div style={styles.sectionLabel}>{t('articleDetails.structuredReviewAnonymous')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {anonymizedStructuredReviews.length === 0 ? (
                        <Typography.Text type="secondary">{t('articleDetails.noAnonymousReviews')}</Typography.Text>
                    ) : anonymizedStructuredReviews.map((review) => (
                        <Card key={review.id} size="small">
                            <Typography.Text strong>{review.reviewerLabel}</Typography.Text>
                            <Typography.Paragraph style={{ marginTop: 8, marginBottom: 8 }}>
                                {review.summaryNotes}
                            </Typography.Paragraph>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {review.scores.map((score) => (
                                    <Tag key={`${review.id}-${score.criterion}`}>{score.criterion}: {score.score}</Tag>
                                ))}
                            </div>
                            {review.submittedAt && (
                                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                    {t('articleDetails.submittedAt')}: {new Date(review.submittedAt).toLocaleString(dateTimeLocale)}
                                </Typography.Text>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const renderMaterialsSection = () => (
        <div style={styles.sectionBlock}>
            <div style={styles.sectionLabel}>{t('articleDetails.materialsByVersion')}</div>
            {isLoadingMaterials ? (
                <Spin size="small" />
            ) : (
                <>
                    <Select
                        style={{ width: '100%', marginBottom: 8 }}
                        value={currentVersion}
                        options={(versions.length > 0 ? versions : [{ versionNumber: 1 } as ArticleVersionDto]).map((versionItem) => ({
                            label: t('articleDetails.versionLabel', { version: versionItem.versionNumber }),
                            value: versionItem.versionNumber,
                        }))}
                        onChange={(value) => setCurrentVersion(Number(value))}
                    />

                    {materialsError && (
                        <Typography.Text type="danger" style={{ display: 'block', marginBottom: 8 }}>
                            {materialsError}
                        </Typography.Text>
                    )}

                    <div style={{ marginBottom: 8 }}>
                        <Typography.Text strong>{t('articleDetails.mainManuscript')}</Typography.Text>
                        <div>
                            <Typography.Text type="secondary">
                                {selectedVersionData?.mainAttachment?.fileName ?? t('articleDetails.noPdf')}
                            </Typography.Text>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Typography.Text strong>{t('articleDetails.supplements')}</Typography.Text>
                        {(selectedVersionData?.supplements?.length ?? 0) === 0 ? (
                            <Typography.Text type="secondary">{t('articleDetails.noSupplements')}</Typography.Text>
                        ) : (
                            selectedVersionData?.supplements.map((supplement) => (
                                <Button
                                    key={supplement.id}
                                    size="small"
                                    onClick={() => {
                                        void handleDownloadSupplement(supplement)
                                    }}
                                    disabled={downloadingSupplementId === supplement.id}
                                >
                                    {supplement.fileName}
                                </Button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    )

    const renderCommentsList = () => (
        <div style={styles.commentsScroll}>
            {isCommentsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <Spin />
                </div>
            ) : commentThreads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                    <CommentOutlined style={{ fontSize: 48, opacity: 0.3 }} />
                    <Typography.Text style={{ display: 'block', marginTop: 8 }}>{t('articleDetails.noComments')}</Typography.Text>
                </div>
            ) : (
                commentThreads.map((thread) => (
                    <Card key={thread.id} style={styles.commentCard}>
                        <div style={styles.commentHeader}>
                            <div>
                                <Typography.Text strong>{getThreadReviewerLabel(thread)}</Typography.Text>
                                <Tag style={{ marginLeft: 8 }}>v{thread.version}</Tag>
                            </div>
                            <Tag>{thread.status}</Tag>
                        </div>

                        <div style={styles.commentMeta}>
                            {thread.section && (
                                <>
                                    <Typography.Text>{thread.section}</Typography.Text>
                                    <Typography.Text>•</Typography.Text>
                                </>
                            )}
                            <Typography.Text>{t('notifications.pageNumber', { page: thread.pageNumber })}</Typography.Text>
                            {thread.createdAt && (
                                <>
                                    <Typography.Text>•</Typography.Text>
                                    <Typography.Text>
                                        {new Date(thread.createdAt).toLocaleDateString(dateTimeLocale)}
                                    </Typography.Text>
                                </>
                            )}
                        </div>

                        {thread.selectedText && (
                            <div style={{ padding: 8, borderLeft: '3px solid var(--article-warning-border, #faad14)', marginBottom: 8, fontSize: 13, fontStyle: 'italic' }}>
                                "{thread.selectedText}"
                            </div>
                        )}

                        {thread.comments.length > 0 && (
                            <>
                                <div style={styles.commentContent}>
                                    <Typography.Text>{thread.comments[0].content}</Typography.Text>
                                </div>

                                {thread.comments.length > 1 && (
                                    <div style={styles.commentReplies}>
                                        {thread.comments.slice(1).map((reply) => (
                                            <div key={reply.id} style={styles.replyItem}>
                                                <Typography.Text strong>{displayAuthorName(reply)}</Typography.Text>
                                                {reply.createdAt && (
                                                    <Typography.Text type='secondary' style={{ marginLeft: 8 }}>
                                                        {new Date(reply.createdAt).toLocaleDateString(dateTimeLocale)}
                                                    </Typography.Text>
                                                )}
                                                <Typography.Text style={{ display: 'block', marginTop: 4 }}>{reply.content}</Typography.Text>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {canReplyToComments ? (
                                    replyingTo === thread.id ? (
                                        <div style={styles.replyForm}>
                                            <Input.TextArea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder={t('articleDetails.replyPlaceholder')}
                                                rows={3}
                                            />
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <Button size="small" onClick={() => { setReplyingTo(null); setReplyText('') }}>{t('articleDetails.cancel')}</Button>
                                                <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleReply(thread.id)} disabled={!replyText.trim() || isReplying}>{t('articleDetails.send')}</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button size="small" onClick={() => setReplyingTo(thread.id)} style={{ marginTop: 8 }} icon={<CommentOutlined />}>{t('articleDetails.reply')}</Button>
                                    )
                                ) : null}
                            </>
                        )}
                    </Card>
                ))
            )}
        </div>
    )

    return (
        <div style={{ ...styles.root, ...articleThemeVars }}>
            {isMobile ? (
                <Drawer
                    placement="left"
                    onClose={() => setIsSidebarVisible(false)}
                    open={isSidebarVisible}
                    width={320}
                    mask={true}
                    zIndex={1002}
                    bodyStyle={{ padding: 0 }}
                >
                    <div style={styles.sidebarHeader}>
                        <Tag>{statusInfo.label}</Tag>
                    </div>

                    <div style={styles.sidebarScroll}>
                        {/* Basic Info */}
                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.submittedDate')}</div>
                            <div style={styles.metadataRow}>
                                <CalendarOutlined />
                                <Typography.Text>{submittedDate}</Typography.Text>
                            </div>
                        </div>

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.track')}</div>
                            <Typography.Text style={styles.sectionContent}>{trackName}</Typography.Text>
                        </div>

                        {/* Abstract */}
                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.abstract')}</div>
                            <Typography.Text style={styles.sectionContent}>{article.abstract}</Typography.Text>
                        </div>

                        {/* Conclusion */}
                        {article.conclusion && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.conclusion')}</div>
                                <Typography.Text style={styles.sectionContent}>{article.conclusion}</Typography.Text>
                            </div>
                        )}

                        {/* Authors */}
                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.authors')}</div>
                            <div style={styles.authorsList}>
                                {article.authors.map((author, index) => (
                                    <div key={author.id || index} style={styles.authorItem}>
                                        <div>
                                            <Typography.Text strong>{author.name}</Typography.Text>
                                            <div>
                                                <Typography.Text type="secondary">{author.email}</Typography.Text>
                                            </div>
                                            <div>
                                                <Typography.Text type="secondary">{author.institution.name}</Typography.Text>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reviewers */}
                        {article.reviewers && article.reviewers.length > 0 && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.reviewers')}</div>
                                <div style={styles.reviewersList}>
                                    {canManageReviewers ? (
                                        article.reviewers.map((reviewer) => (
                                            <Tag key={reviewer.id} icon={<UserOutlined />}>
                                                {reviewer.name}
                                            </Tag>
                                        ))
                                    ) : currentUser?.role === 'REVIEWER' ? (
                                        // Reviewers should not see other reviewers; show only themselves.
                                        article.reviewers
                                            .filter((reviewer) => {
                                                const matchesUserId = reviewer.user?.id && currentUserId && reviewer.user.id === currentUserId
                                                const matchesEmail = reviewer.email?.toLowerCase() === (currentUserEmail ?? '').toLowerCase()
                                                return !!(matchesUserId || matchesEmail)
                                            })
                                            .map((reviewer) => (
                                                <Tag key={reviewer.id} icon={<UserOutlined />}>{t('articleDetails.you')}</Tag>
                                            ))
                                    ) : (
                                        // Researchers see anonymized stable reviewer numbering.
                                        article.reviewers.map((reviewer, index) => (
                                            <Tag key={reviewer.id} icon={<UserOutlined />}>{t('articleDetails.reviewerLabel', { index: reviewer.displayIndex ?? index + 1 })}</Tag>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {renderStructuredReviewPanel()}

                        {renderMaterialsSection()}

                        {/* Initial Review Note */}
                        {article.initialReviewNote && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.initialReviewNote')}</div>
                                <Typography.Text style={styles.sectionContent}>{article.initialReviewNote}</Typography.Text>
                            </div>
                        )}

                        {/* Initial Review Next Steps */}
                        {article.initialReviewNextSteps && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.nextSteps')}</div>
                                <Typography.Text style={styles.sectionContent}>{article.initialReviewNextSteps}</Typography.Text>
                            </div>
                        )}
                    </div>
                </Drawer>
            ) : (
                <div style={styles.sidebarSection}>
                    <div style={styles.sidebarHeader}>
                        <Tag>{statusInfo.label}</Tag>
                    </div>

                    <div style={styles.sidebarScroll}>
                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.submittedDate')}</div>
                            <div style={styles.metadataRow}>
                                <CalendarOutlined />
                                <Typography.Text>{submittedDate}</Typography.Text>
                            </div>
                        </div>

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.track')}</div>
                            <Typography.Text style={styles.sectionContent}>{trackName}</Typography.Text>
                        </div>

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.abstract')}</div>
                            <Typography.Text style={styles.sectionContent}>{article.abstract}</Typography.Text>
                        </div>

                        {article.conclusion && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.conclusion')}</div>
                                <Typography.Text style={styles.sectionContent}>{article.conclusion}</Typography.Text>
                            </div>
                        )}

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>{t('articleDetails.authors')}</div>
                            <div style={styles.authorsList}>
                                {article.authors.map((author, index) => (
                                    <div key={author.id || index} style={styles.authorItem}>
                                        <div>
                                            <Typography.Text strong>{author.name}</Typography.Text>
                                            <div>
                                                <Typography.Text type="secondary">{author.email}</Typography.Text>
                                            </div>
                                            <div>
                                                <Typography.Text type="secondary">{author.institution.name}</Typography.Text>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {article.reviewers && article.reviewers.length > 0 && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.reviewers')}</div>
                                <div style={styles.reviewersList}>
                                    {canManageReviewers ? (
                                        article.reviewers.map((reviewer) => (
                                            <Tag key={reviewer.id} icon={<UserOutlined />}>
                                                {reviewer.name}
                                            </Tag>
                                        ))
                                    ) : currentUser?.role === 'REVIEWER' ? (
                                        article.reviewers
                                            .filter((reviewer) => {
                                                const matchesUserId = reviewer.user?.id && currentUserId && reviewer.user.id === currentUserId
                                                const matchesEmail = reviewer.email?.toLowerCase() === (currentUserEmail ?? '').toLowerCase()
                                                return !!(matchesUserId || matchesEmail)
                                            })
                                            .map((reviewer) => (
                                                <Tag key={reviewer.id} icon={<UserOutlined />}>{t('articleDetails.you')}</Tag>
                                            ))
                                    ) : (
                                        article.reviewers.map((reviewer, index) => (
                                            <Tag key={reviewer.id} icon={<UserOutlined />}>{t('articleDetails.reviewerLabel', { index: reviewer.displayIndex ?? index + 1 })}</Tag>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {renderStructuredReviewPanel()}

                        {renderMaterialsSection()}

                        {article.initialReviewNote && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.initialReviewNote')}</div>
                                <Typography.Text style={styles.sectionContent}>{article.initialReviewNote}</Typography.Text>
                            </div>
                        )}

                        {article.initialReviewNextSteps && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>{t('articleDetails.nextSteps')}</div>
                                <Typography.Text style={styles.sectionContent}>{article.initialReviewNextSteps}</Typography.Text>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Viewer Section */}
            <div style={styles.viewerSection}>
                <div style={styles.viewerHeader}>
                    <Typography.Text style={styles.viewerTitle}>{article.title}</Typography.Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Select
                            style={{ minWidth: 140 }}
                            value={currentVersion}
                            options={(versions.length > 0 ? versions : [{ versionNumber: 1 } as ArticleVersionDto]).map((versionItem) => ({
                                label: t('articleDetails.versionLabel', { version: versionItem.versionNumber }),
                                value: versionItem.versionNumber,
                            }))}
                            onChange={(value) => setCurrentVersion(Number(value))}
                        />
                        {pdfUrl && pdfUrl.startsWith('http') && (
                            <Button
                                type="primary"
                                icon={<FilePdfOutlined />}
                                onClick={() => {
                                    void handleDownloadMain()
                                }}
                                size="small"
                            >
                                {t('articleDetails.download')}
                            </Button>
                        )}
                        {canManageReviewers &&
                            (article.status === ArticleStatus.ACCEPT_REQUESTED ||
                                article.status === ArticleStatus.REJECT_REQUESTED) && (
                                <>
                                    <Button
                                        type="primary"
                                        icon={<CheckOutlined />}
                                        size="small"
                                        disabled={isApproving || isRejecting}
                                        onClick={() => {
                                            const ok = window.confirm(t('articleDetails.confirmApprove'))
                                            if (!ok) return
                                            approveArticle()
                                        }}
                                    >
                                        {isApproving ? t('articleDetails.processing') : t('articleDetails.approve')}
                                    </Button>
                                    <Button
                                        danger
                                        icon={<CloseOutlined />}
                                        size="small"
                                        disabled={isApproving || isRejecting}
                                        onClick={() => {
                                            const ok = window.confirm(t('articleDetails.confirmReject'))
                                            if (!ok) return
                                            rejectArticle()
                                        }}
                                    >
                                        {isRejecting ? t('articleDetails.processing') : t('articleDetails.reject')}
                                    </Button>
                                </>
                            )}
                        {canDoInitialReview && (
                            <Button type="primary" onClick={() => navigate(`/articles/${articleId}?view=initialReview`)} size="small">{t('articleDetails.initialReview')}</Button>
                        )}
                        {canManageReviewers && (
                            <Button onClick={() => setIsInviteReviewersOpen(true)} size="small">{t('articleDetails.manageReviewers')}</Button>
                        )}
                        {isAssignedReviewer && (
                            <Button type="primary" onClick={() => navigate(`/articles/${articleId}?view=review`)} size="small">{t('articleDetails.reviewArticle')}</Button>
                        )}
                        {canSubmitRevision && (
                            <Button
                                type="primary"
                                icon={<FilePdfOutlined />}
                                disabled={isStartingRevisions}
                                onClick={() => {
                                    if (!safeArticleId) return
                                    if (article?.status === ArticleStatus.REVISIONS_REQUESTED) {
                                        startRevisions(undefined as never, {
                                            onSuccess: () => {
                                                void refetch()
                                            },
                                        })
                                    }
                                    setShowSubmitRevision(true)
                                }}
                                size="small"
                            >
                                {isStartingRevisions ? t('articleDetails.processing') : t('articleDetails.submitRevision')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* PDF Viewer */}
                <PdfViewer fileUrl={pdfUrl} emptyMessage={t('articleDetails.noPdf')} />
            </div>

            {/* Mobile Sidebar Toggle */}
            <Button
                style={{ ...styles.sidebarToggle, display: isMobile ? 'block' : 'none' }}
                type="primary"
                shape="circle"
                size="large"
                icon={<MenuOutlined />}
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                title={isSidebarVisible ? t('articleDetails.hideInfo') : t('articleDetails.showInfo')}
            />

            {/* Comments Section - Desktop */}
            <div style={{ ...(styles.commentsSection as object), ...(isMobile ? { display: 'none' } : (!isCommentsPanelVisible ? styles.commentsSectionHidden : {})) }}>
                <div style={styles.commentsHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CommentOutlined style={{ fontSize: 18 }} />
                        <Typography.Text strong>{t('articleDetails.commentsCount', { count: commentThreads.length })}</Typography.Text>
                    </div>

                    {isCommentsPanelVisible ? (
                        <Button icon={<CloseOutlined />} onClick={() => setIsCommentsPanelVisible(false)} />
                    ) : null}
                </div>
                {renderCommentsList()}
            </div>

            {/* Comments Dialog - Mobile */}
            {isMobile && (
                <Modal
                    open={isCommentsDialogOpen}
                    onCancel={() => setIsCommentsDialogOpen(false)}
                    footer={null}
                    width={520}
                    bodyStyle={{ padding: 0, maxHeight: '70vh', overflow: 'hidden' }}
                    title={t('articleDetails.comments')}
                >
                    <div style={{ height: '60vh', overflow: 'auto' }}>{renderCommentsList()}</div>
                </Modal>
            )}

            {/* Mobile Comments Toggle */}
            <Button
                style={{ ...styles.commentsToggle, display: isMobile ? 'block' : 'none' }}
                type="primary"
                shape="circle"
                size="large"
                icon={<CommentOutlined />}
                onClick={() => {
                    if (isMobile) {
                        setIsCommentsDialogOpen(!isCommentsDialogOpen)
                    } else {
                        setIsCommentsPanelVisible(!isCommentsPanelVisible)
                    }
                }}
                title={isMobile ? (isCommentsDialogOpen ? t('articleDetails.hideComments') : t('articleDetails.showComments')) : (isCommentsPanelVisible ? t('articleDetails.hideComments') : t('articleDetails.showComments'))}
            />

            {/* Invite More Reviewers Dialog */}
            {articleId && article && (
                <InviteReviewersDialog
                    open={isInviteReviewersOpen}
                    onOpenChange={setIsInviteReviewersOpen}
                    articleId={articleId}
                    invitedReviewers={article.reviewers ?? []}
                />
            )}

            {/* Revision Submission Dialog */}
            <SubmitRevision
                articleId={articleId || ''}
                isOpen={showSubmitRevision}
                onClose={() => setShowSubmitRevision(false)}
                onSuccess={() => {
                    setShowSubmitRevision(false)
                    // Refetch article to show updated status
                    if (refetch) refetch()
                }}
            />
        </div>
    )
}

export default ArticleDetails
