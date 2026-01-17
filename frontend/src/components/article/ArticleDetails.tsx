import { useParams, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import {
    makeStyles,
    Button,
    Text,
    Badge,
    Spinner,
    tokens,
    Card,
    Textarea,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
} from '@fluentui/react-components'
import {
    ArrowLeftRegular,
    DocumentRegular,
    PersonRegular,
    CalendarRegular,
    NavigationRegular,
    CommentRegular,
    SendRegular,
    CheckmarkRegular,
    DismissRegular,
} from '@fluentui/react-icons'
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
import type { CommentDto, CommentThreadDto } from '../../models'

const useStyles = makeStyles({
    root: {
        display: 'flex',
        height: 'calc(100vh - 64px)',
        width: '100%',
        overflow: 'hidden',
        flexDirection: 'row',
        position: 'relative',
        '@media (max-width: 1024px)': {
            flexDirection: 'column',
        },
    },
    sidebarSection: {
        width: '320px',
        flexShrink: 0,
        borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 100,
        '@media (max-width: 1024px)': {
            position: 'fixed',
            left: 0,
            top: '64px',
            height: 'calc(100vh - 64px)',
            zIndex: 1002,
            boxShadow: tokens.shadow16,
            borderRight: 'none',
        },
    },
    sidebarHidden: {
        '@media (max-width: 1024px)': {
            transform: 'translateX(-100%)',
        },
    },
    sidebarHeader: {
        padding: '16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    sidebarScroll: {
        flex: 1,
        overflow: 'auto',
        padding: '16px',
    },
    sectionBlock: {
        marginBottom: '16px',
    },
    sectionLabel: {
        fontSize: '12px',
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground3,
        textTransform: 'uppercase',
        marginBottom: '6px',
    },
    sectionContent: {
        fontSize: '14px',
        color: tokens.colorNeutralForeground1,
        wordBreak: 'break-word',
    },
    metadataRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        color: tokens.colorNeutralForeground2,
    },
    authorsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    authorItem: {
        padding: '8px',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        fontSize: '13px',
    },
    reviewersList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
    },
    viewerSection: {
        flex: 1,
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '@media (max-width: 1024px)': {
            height: 'calc(100vh - 64px)',
        },
    },
    viewerHeader: {
        padding: '16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
    },
    viewerTitle: {
        fontSize: tokens.fontSizeHero700,
        fontWeight: tokens.fontWeightSemibold,
        flex: 1,
    },
    overlay: {
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 999,
        '@media (min-width: 1025px)': {
            display: 'none',
        },
    },
    sidebarToggle: {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 1001,
        boxShadow: tokens.shadow16,
        '@media (min-width: 1025px)': {
            display: 'none',
        },
    },
    centerContent: {
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        padding: '24px',
        textAlign: 'center',
    },
    // Comments Section
    commentsSection: {
        width: '400px',
        flexShrink: 0,
        borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out',
        '@media (max-width: 1024px)': {
            display: 'none',
        },
    },
    commentsSectionHidden: {
        '@media (min-width: 1025px)': {
            transform: 'translateX(100%)',
        },
    },
    commentsDialogSurface: {
        maxWidth: '90vw',
        width: '520px',
        maxHeight: '90vh',
        '@media (max-width: 1024px)': {
            width: '95vw',
            maxWidth: '95vw',
        },
    },
    commentsDialogBody: {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(90vh - 100px)',
        overflow: 'hidden',
    },
    commentsHeader: {
        padding: '16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    commentsScroll: {
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '12px',
    },
    commentCard: {
        padding: '12px',
        width: '100%',
        alignSelf: 'stretch',
        flexShrink: 0,
    },
    commentHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
    },
    commentMeta: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: '12px',
        color: tokens.colorNeutralForeground3,
        marginBottom: '8px',
    },
    commentContent: {
        marginBottom: '8px',
    },
    commentReplies: {
        marginLeft: '16px',
        marginTop: '12px',
        paddingLeft: '12px',
        borderLeft: `2px solid ${tokens.colorNeutralStroke2}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    replyItem: {
        padding: '8px',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
    },
    replyForm: {
        marginTop: '8px',
        padding: '12px',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    commentsToggle: {
        position: 'fixed',
        bottom: '80px',
        right: '24px',
        zIndex: 1001,
        boxShadow: tokens.shadow16,
        '@media (min-width: 1025px)': {
            display: 'none',
        },
    },
})

function ArticleDetails() {
    const classes = useStyles()
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

    const isMyComment = (comment?: CommentDto | null): boolean => {
        if (!comment || !currentUserId) return false
        return comment.createdBy === currentUserId || comment.authorId === currentUserId
    }

    const displayAuthorName = (comment: CommentDto): string => {
        return isMyComment(comment) ? 'Bạn' : comment.authorName
    }

    const getThreadReviewerLabel = (thread: CommentThreadDto): string => {
        // If the latest/first comment is authored by current user, show "Bạn".
        if (thread.comments && thread.comments.length > 0 && isMyComment(thread.comments[0])) {
            return 'Bạn'
        }

        // Prefer stable anonymized label from backend.
        if (thread.reviewerLabel) {
            return thread.reviewerLabel
        }

        // Fallback to displayIndex on article reviewers if available.
        if (thread.reviewerId && article?.reviewers) {
            const reviewer = article.reviewers.find((r) => r.id === thread.reviewerId)
            if (reviewer?.displayIndex != null) {
                return `Người phản biện ${reviewer.displayIndex}`
            }
        }
        return 'Người phản biện'
    }

    const currentRoles: string[] = (() => {
        const roles = (currentUser as { roles?: string[] } | undefined)?.roles
        if (Array.isArray(roles) && roles.length > 0) return roles
        const role = (currentUser as { role?: string } | undefined)?.role
        return role ? [role] : []
    })()

    const canManageReviewers = currentRoles.includes('ADMIN') || currentRoles.includes('EDITOR')

    const handleReply = (threadId: string) => {
        if (!replyText.trim()) return
        
        replyToComment({
            threadId,
            data: { 
                content: replyText,
                authorName: currentUser?.name ?? currentUserEmail ?? 'Người dùng',
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

    const canReplyToComments = !!isAuthor || canManageReviewers

    // Check if current user can submit revision
    const canSubmitRevision =
        !!isAuthor &&
        (article?.status === ArticleStatus.REVISIONS_REQUESTED || article?.status === ArticleStatus.REVISIONS)

    // Check if current user is an editor and article is awaiting initial review
    const canDoInitialReview = canManageReviewers && article?.status === ArticleStatus.SUBMITTED

    const statusLabelMap: Record<ArticleStatusType, { label: string; color: 'brand' | 'informative' | 'important' | 'success' | 'warning' | 'danger' }> = {
        [ArticleStatus.SUBMITTED]: { label: 'Đã nộp', color: 'informative' },
        [ArticleStatus.PENDING_REVIEW]: { label: 'Chờ phản biện', color: 'informative' },
        [ArticleStatus.IN_REVIEW]: { label: 'Đang phản biện', color: 'brand' },
        [ArticleStatus.REVISIONS_REQUESTED]: { label: 'Yêu cầu sửa chữa', color: 'warning' },
        [ArticleStatus.REVISIONS]: { label: 'Đang sửa chữa', color: 'important' },
        [ArticleStatus.ACCEPTED]: { label: 'Đã chấp nhận', color: 'success' },
        [ArticleStatus.REJECTED]: { label: 'Đã từ chối', color: 'danger' },
        [ArticleStatus.ACCEPT_REQUESTED]: { label: 'Đề nghị chấp thuận', color: 'warning' },
        [ArticleStatus.REJECT_REQUESTED]: { label: 'Đề nghị loại bỏ', color: 'warning' },
    }

    // Loading state - center content
    if (isLoading && !article) {
        return (
            <div className={classes.centerContent}>
                <Spinner size="large" label="Đang tải thông tin bài báo..." />
            </div>
        )
    }

    // Error state - center content
    if (isError || !article) {
        return (
            <div className={classes.centerContent}>
                <Text size={500} weight="semibold">Không thể tải thông tin bài báo</Text>
                <Button
                    appearance="primary"
                    icon={<ArrowLeftRegular />}
                    onClick={() => navigate('/')}
                >
                    Quay lại trang chủ
                </Button>
            </div>
        )
    }

    const statusInfo = statusLabelMap[article.status] || { label: article.status, color: 'informative' as const }

    // Determine PDF URL for viewer - use same logic as ReviewArticle
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const pdfUrl = (() => {
        if (!articleId) return null
        const proxyUrl = `${apiBaseUrl}/articles/${articleId}/pdf`
        const link = (article.link ?? '').trim()

        // Prefer proxy when link is missing or clearly an expiring presigned URL.
        if (!link) return proxyUrl
        if (link.includes('X-Amz-') || link.includes('x-amz-')) return proxyUrl

        // If link is already our proxy URL, use it.
        if (link.endsWith(`/articles/${articleId}/pdf`)) return link

        // Otherwise allow external/manual links.
        return link
    })()

    const trackName = article.track?.name ?? 'Chưa gán'
    const submittedDate = article.createdAt
        ? new Date(article.createdAt).toLocaleString('vi-VN')
        : 'Chưa cập nhật'

    const renderCommentsList = () => (
        <div className={classes.commentsScroll}>
            {isCommentsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                    <Spinner size="medium" />
                </div>
            ) : commentThreads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: tokens.colorNeutralForeground3 }}>
                    <CommentRegular style={{ fontSize: '48px', opacity: 0.3 }} />
                    <Text size={300} style={{ display: 'block', marginTop: '8px' }}>
                        Chưa có nhận xét nào
                    </Text>
                </div>
            ) : (
                commentThreads.map((thread) => (
                    <Card key={thread.id} className={classes.commentCard}>
                        <div className={classes.commentHeader}>
                            <div>
                                <Text weight="semibold" size={300}>
                                    {getThreadReviewerLabel(thread)}
                                </Text>
                                <Badge appearance="tint" size="small" style={{ marginLeft: '8px' }}>
                                    v{thread.version}
                                </Badge>
                            </div>
                            <Badge appearance="outline" size="small">
                                {thread.status}
                            </Badge>
                        </div>

                        <div className={classes.commentMeta}>
                            {thread.section && (
                                <>
                                    <Text size={200}>{thread.section}</Text>
                                    <Text size={200}>•</Text>
                                </>
                            )}
                            <Text size={200}>Trang {thread.pageNumber}</Text>
                            {thread.createdAt && (
                                <>
                                    <Text size={200}>•</Text>
                                    <Text size={200}>
                                        {new Date(thread.createdAt).toLocaleDateString('vi-VN')}
                                    </Text>
                                </>
                            )}
                        </div>

                        {thread.selectedText && (
                            <div
                                style={{
                                    padding: '8px',
                                    backgroundColor: tokens.colorNeutralBackground3,
                                    borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}`,
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontStyle: 'italic',
                                }}
                            >
                                "{thread.selectedText}"
                            </div>
                        )}

                        {thread.comments.length > 0 && (
                            <>
                                <div className={classes.commentContent}>
                                    <Text size={300}>{thread.comments[0].content}</Text>
                                </div>

                                {thread.comments.length > 1 && (
                                    <div className={classes.commentReplies}>
                                        {thread.comments.slice(1).map((reply) => (
                                            <div key={reply.id} className={classes.replyItem}>
                                                <Text weight="semibold" size={200}>
                                                    {displayAuthorName(reply)}
                                                </Text>
                                                {reply.createdAt && (
                                                    <Text
                                                        size={100}
                                                        style={{ color: tokens.colorNeutralForeground3, marginLeft: '8px' }}
                                                    >
                                                        {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                                    </Text>
                                                )}
                                                <Text size={300} style={{ display: 'block', marginTop: '4px' }}>
                                                    {reply.content}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {canReplyToComments ? (
                                    replyingTo === thread.id ? (
                                        <div className={classes.replyForm}>
                                            <Textarea
                                                value={replyText}
                                                onChange={(_, data) => setReplyText(data.value)}
                                                placeholder="Nhập câu trả lời..."
                                                rows={3}
                                            />
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <Button
                                                    size="small"
                                                    appearance="subtle"
                                                    onClick={() => {
                                                        setReplyingTo(null)
                                                        setReplyText('')
                                                    }}
                                                >
                                                    Hủy
                                                </Button>
                                                <Button
                                                    size="small"
                                                    appearance="primary"
                                                    icon={<SendRegular />}
                                                    onClick={() => handleReply(thread.id)}
                                                    disabled={!replyText.trim() || isReplying}
                                                >
                                                    Gửi
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="small"
                                            appearance="subtle"
                                            icon={<CommentRegular />}
                                            onClick={() => setReplyingTo(thread.id)}
                                            style={{ marginTop: '8px' }}
                                        >
                                            Trả lời
                                        </Button>
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
        <div className={classes.root}>
            {/* Overlay for mobile */}
            {isSidebarVisible && (
                <div className={classes.overlay} onClick={() => setIsSidebarVisible(false)} />
            )}

            {/* Sidebar with Article Info */}
            <div
                className={`${classes.sidebarSection} ${
                    !isSidebarVisible ? classes.sidebarHidden : ''
                }`}
            >
                <div className={classes.sidebarHeader}>
                    <Badge appearance="filled" color={statusInfo.color}>
                        {statusInfo.label}
                    </Badge>
                </div>

                <div className={classes.sidebarScroll}>
                    {/* Basic Info */}
                    <div className={classes.sectionBlock}>
                        <div className={classes.sectionLabel}>Ngày nộp</div>
                        <div className={classes.metadataRow}>
                            <CalendarRegular />
                            <Text size={300}>{submittedDate}</Text>
                        </div>
                    </div>

                    <div className={classes.sectionBlock}>
                        <div className={classes.sectionLabel}>Lĩnh vực</div>
                        <Text size={300} className={classes.sectionContent}>
                            {trackName}
                        </Text>
                    </div>

                    {/* Abstract */}
                    <div className={classes.sectionBlock}>
                        <div className={classes.sectionLabel}>Tóm tắt</div>
                        <Text size={300} className={classes.sectionContent}>
                            {article.abstract}
                        </Text>
                    </div>

                    {/* Conclusion */}
                    {article.conclusion && (
                        <div className={classes.sectionBlock}>
                            <div className={classes.sectionLabel}>Kết luận</div>
                            <Text size={300} className={classes.sectionContent}>
                                {article.conclusion}
                            </Text>
                        </div>
                    )}

                    {/* Authors */}
                    <div className={classes.sectionBlock}>
                        <div className={classes.sectionLabel}>Tác giả</div>
                        <div className={classes.authorsList}>
                            {article.authors.map((author, index) => (
                                <div key={author.id || index} className={classes.authorItem}>
                                    <div>
                                        <Text weight="semibold" size={300}>
                                            {author.name}
                                        </Text>
                                        <Text size={200}>{author.email}</Text>
                                        <Text size={200}>{author.institution.name}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviewers */}
                    {article.reviewers && article.reviewers.length > 0 && (
                        <div className={classes.sectionBlock}>
                            <div className={classes.sectionLabel}>Người phản biện</div>
                            <div className={classes.reviewersList}>
                                {canManageReviewers ? (
                                    article.reviewers.map((reviewer) => (
                                        <Badge
                                            key={reviewer.id}
                                            appearance="outline"
                                            icon={<PersonRegular />}
                                            size="small"
                                        >
                                            {reviewer.name}
                                        </Badge>
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
                                            <Badge
                                                key={reviewer.id}
                                                appearance="outline"
                                                icon={<PersonRegular />}
                                                size="small"
                                            >
                                                Bạn
                                            </Badge>
                                        ))
                                ) : (
                                    // Researchers see anonymized stable reviewer numbering.
                                    article.reviewers.map((reviewer, index) => (
                                        <Badge
                                            key={reviewer.id}
                                            appearance="outline"
                                            icon={<PersonRegular />}
                                            size="small"
                                        >
                                            Người phản biện {reviewer.displayIndex ?? index + 1}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Initial Review Note */}
                    {article.initialReviewNote && (
                        <div className={classes.sectionBlock}>
                            <div className={classes.sectionLabel}>Ghi chú ban đầu</div>
                            <Text size={300} className={classes.sectionContent}>
                                {article.initialReviewNote}
                            </Text>
                        </div>
                    )}

                    {/* Initial Review Next Steps */}
                    {article.initialReviewNextSteps && (
                        <div className={classes.sectionBlock}>
                            <div className={classes.sectionLabel}>Các bước tiếp theo</div>
                            <Text size={300} className={classes.sectionContent}>
                                {article.initialReviewNextSteps}
                            </Text>
                        </div>
                    )}
                </div>
            </div>

            {/* Viewer Section */}
            <div className={classes.viewerSection}>
                <div className={classes.viewerHeader}>
                    <Text className={classes.viewerTitle}>{article.title}</Text>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {pdfUrl && pdfUrl.startsWith('http') && (
                            <Button
                                appearance="primary"
                                icon={<DocumentRegular />}
                                onClick={() => window.open(pdfUrl, '_blank')}
                                size="small"
                            >
                                Tải xuống
                            </Button>
                        )}
                        {canManageReviewers &&
                            (article.status === ArticleStatus.ACCEPT_REQUESTED ||
                                article.status === ArticleStatus.REJECT_REQUESTED) && (
                                <>
                                    <Button
                                        appearance="primary"
                                        icon={<CheckmarkRegular />}
                                        size="small"
                                        disabled={isApproving || isRejecting}
                                        onClick={() => {
                                            const ok = window.confirm('Chấp thuận bài báo này?')
                                            if (!ok) return
                                            approveArticle()
                                        }}
                                    >
                                        {isApproving ? 'Đang xử lý...' : 'Chấp thuận'}
                                    </Button>
                                    <Button
                                        appearance="secondary"
                                        icon={<DismissRegular />}
                                        size="small"
                                        disabled={isApproving || isRejecting}
                                        onClick={() => {
                                            const ok = window.confirm('Từ chối bài báo này?')
                                            if (!ok) return
                                            rejectArticle()
                                        }}
                                    >
                                        {isRejecting ? 'Đang xử lý...' : 'Từ chối'}
                                    </Button>
                                </>
                            )}
                        {canDoInitialReview && (
                            <Button
                                appearance="primary"
                                onClick={() => navigate(`/articles/${articleId}?view=initialReview`)}
                                size="small"
                            >
                                Đánh giá ban đầu
                            </Button>
                        )}
                        {canManageReviewers && (
                            <Button
                                appearance="secondary"
                                onClick={() => setIsInviteReviewersOpen(true)}
                                size="small"
                            >
                                Quản lý reviewer
                            </Button>
                        )}
                        {isAssignedReviewer && (
                            <Button
                                appearance="primary"
                                onClick={() => navigate(`/articles/${articleId}?view=review`)}
                                size="small"
                            >
                                Phản biện bài báo
                            </Button>
                        )}
                        {canSubmitRevision && (
                            <Button
                                appearance="primary"
                                icon={<DocumentRegular />}
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
                                {isStartingRevisions ? 'Đang xử lý...' : 'Nộp Bài Sửa Chữa'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* PDF Viewer */}
                <PdfViewer
                    fileUrl={pdfUrl}
                    emptyMessage="Không có bài báo để xem"
                />
            </div>

            {/* Mobile Sidebar Toggle */}
            <Button
                className={classes.sidebarToggle}
                appearance="primary"
                shape="circular"
                size="large"
                icon={<NavigationRegular />}
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                title={isSidebarVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
            />

            {/* Comments Section - Desktop */}
            <div className={`${classes.commentsSection} ${!isCommentsPanelVisible ? classes.commentsSectionHidden : ''}`}>
                <div className={classes.commentsHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CommentRegular />
                        <Text weight="semibold">Nhận xét ({commentThreads.length})</Text>
                    </div>

                    {isCommentsPanelVisible ? (
                        <Button
                            appearance="subtle"
                            icon={<DismissRegular />}
                            onClick={() => setIsCommentsPanelVisible(false)}
                            title="Ẩn nhận xét"
                        />
                    ) : null}
                </div>
                {renderCommentsList()}
            </div>

            {/* Comments Dialog - Mobile */}
            {isMobile && (
                <Dialog
                    open={isCommentsDialogOpen}
                    onOpenChange={(_, data) => setIsCommentsDialogOpen(data.open)}
                >
                    <DialogSurface className={classes.commentsDialogSurface}>
                        <DialogBody className={classes.commentsDialogBody}>
                            <DialogTitle>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text weight="semibold" size={500}>
                                        Nhận xét
                                    </Text>
                                    <Button
                                        appearance="subtle"
                                        icon={<DismissRegular />}
                                        onClick={() => setIsCommentsDialogOpen(false)}
                                    />
                                </div>
                            </DialogTitle>
                            <DialogContent
                                style={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 0,
                                }}
                            >
                                {renderCommentsList()}
                            </DialogContent>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}

            {/* Mobile Comments Toggle */}
            <Button
                className={classes.commentsToggle}
                appearance="primary"
                shape="circular"
                size="large"
                icon={<CommentRegular />}
                onClick={() => {
                    if (isMobile) {
                        setIsCommentsDialogOpen(!isCommentsDialogOpen)
                    } else {
                        setIsCommentsPanelVisible(!isCommentsPanelVisible)
                    }
                }}
                title={
                    isMobile
                        ? isCommentsDialogOpen
                            ? 'Ẩn nhận xét'
                            : 'Hiện nhận xét'
                        : isCommentsPanelVisible
                            ? 'Ẩn nhận xét'
                            : 'Hiện nhận xét'
                }
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
