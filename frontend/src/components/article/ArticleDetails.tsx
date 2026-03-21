import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Button, Typography, Spin, Card, Input, Modal, Tag, Drawer } from 'antd'
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
import type { CommentDto, CommentThreadDto } from '../../models'

const styles: Record<string, React.CSSProperties> = {
    root: {
        display: 'flex',
        height: 'calc(100vh - 64px)',
        width: '100%',
        overflow: 'hidden',
        flexDirection: 'row',
        position: 'relative',
    },
    sidebarSection: {
        width: 320,
        flexShrink: 0,
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 1002,
    },
    sidebarHidden: {
        transform: 'translateX(-100%)',
    },
    sidebarHeader: {
        padding: 16,
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa',
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
    sectionLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 6, color: '#8c8c8c' },
    sectionContent: { fontSize: 14, color: '#000', wordBreak: 'break-word' },
    metadataRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#595959' },
    authorsList: { display: 'flex', flexDirection: 'column', gap: 8 },
    authorItem: { padding: 8, backgroundColor: '#fafafa', borderRadius: 6, fontSize: 13 },
    reviewersList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    viewerSection: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
    viewerHeader: { padding: 16, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    viewerTitle: { fontSize: 20, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    overlay: { position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 },
    sidebarToggle: { position: 'fixed', bottom: 24, left: 24, zIndex: 1003 },
    centerContent: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' },
    commentsSection: { width: 400, flexShrink: 0, borderLeft: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'hidden', transition: 'transform 0.3s ease-in-out' },
    commentsSectionHidden: { transform: 'translateX(100%)' },
    commentsDialogSurface: { maxWidth: '90vw', width: 520, maxHeight: '90vh' },
    commentsDialogBody: { display: 'flex', flexDirection: 'column', maxHeight: 'calc(90vh - 100px)', overflow: 'hidden' },
    commentsHeader: { padding: 16, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    commentsScroll: { flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 },
    commentCard: { padding: 12, width: '100%', alignSelf: 'stretch', flexShrink: 0 },
    commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    commentMeta: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#8c8c8c', marginBottom: 8 },
    commentContent: { marginBottom: 8 },
    commentReplies: { marginLeft: 16, marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 },
    replyItem: { padding: 8, backgroundColor: '#fafafa', borderRadius: 6 },
    replyForm: { marginTop: 8, padding: 12, backgroundColor: '#fafafa', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8 },
    commentsToggle: { position: 'fixed', bottom: 80, right: 24, zIndex: 1003 },
}

function ArticleDetails() {
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

    const isChair = currentRoles.includes('CHAIR') || currentRoles.includes('ADMIN')
    const canManageReviewers = currentRoles.includes('ADMIN') || currentRoles.includes('EDITOR') || currentRoles.includes('CHAIR')

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
        [ArticleStatus.SUBMITTED]: { label: 'Đã nộp', color: 'informative' },
        [ArticleStatus.PENDING_REVIEW]: { label: 'Chờ phản biện', color: 'informative' },
        [ArticleStatus.IN_REVIEW]: { label: 'Đang phản biện', color: 'brand' },
        [ArticleStatus.REVIEWS_COMPLETED]: { label: 'Phản biện hoàn thành', color: 'brand' },
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
            <div style={styles.centerContent}>
                <Spin size="large" tip="Đang tải thông tin bài báo..." />
            </div>
        )
    }

    // Error state - center content
    if (isError || !article) {
        return (
            <div style={styles.centerContent}>
                <Typography.Text strong>Không thể tải thông tin bài báo</Typography.Text>
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                    style={{ marginTop: 12 }}
                >
                    Quay lại trang chủ
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

    const renderStructuredReviewPanel = () => {
        if (!isChair && !isAuthor) return null

        if (isChair) {
            return (
                <div style={styles.sectionBlock}>
                    <div style={styles.sectionLabel}>Structured review (Chair)</div>
                    <Card size="small" style={{ marginBottom: 8 }}>
                        <Typography.Text style={{ display: 'block' }}>
                            Hoàn tất phản biện: {reviewSubmissionCount}/{assignedReviewerCount}
                        </Typography.Text>
                        <Typography.Text style={{ display: 'block' }}>
                            Điểm overall trung bình: {averageOverallScore ?? 'Chưa có'}
                        </Typography.Text>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(recommendationDistribution).length > 0 ? Object.entries(recommendationDistribution).map(([recommendation, count]) => (
                                <Tag key={recommendation}>{recommendation}: {count}</Tag>
                            )) : <Typography.Text type="secondary">Chưa có khuyến nghị</Typography.Text>}
                        </div>
                    </Card>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(article.reviewers ?? []).map((reviewer, index) => {
                            const displayIndex = reviewer.displayIndex ?? index + 1
                            const submitted = submittedReviewerDisplayIndices.has(displayIndex)
                            return (
                                <div key={reviewer.id} style={styles.authorItem}>
                                    <Typography.Text>
                                        Reviewer {displayIndex}: {submitted ? 'Đã nộp' : 'Chưa nộp'}
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
                <div style={styles.sectionLabel}>Structured review (Ẩn danh)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {anonymizedStructuredReviews.length === 0 ? (
                        <Typography.Text type="secondary">Chưa có phản biện ẩn danh.</Typography.Text>
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
                                    Nộp lúc: {new Date(review.submittedAt).toLocaleString('vi-VN')}
                                </Typography.Text>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const renderCommentsList = () => (
        <div style={styles.commentsScroll}>
            {isCommentsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <Spin />
                </div>
            ) : commentThreads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
                    <CommentOutlined style={{ fontSize: 48, opacity: 0.3 }} />
                    <Typography.Text style={{ display: 'block', marginTop: 8 }}>Chưa có nhận xét nào</Typography.Text>
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
                            <Typography.Text>Trang {thread.pageNumber}</Typography.Text>
                            {thread.createdAt && (
                                <>
                                    <Typography.Text>•</Typography.Text>
                                    <Typography.Text>
                                        {new Date(thread.createdAt).toLocaleDateString('vi-VN')}
                                    </Typography.Text>
                                </>
                            )}
                        </div>

                        {thread.selectedText && (
                            <div style={{ padding: 8, backgroundColor: '#fafafa', borderLeft: '3px solid #faad14', marginBottom: 8, fontSize: 13, fontStyle: 'italic' }}>
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
                                                    <Typography.Text style={{ color: '#8c8c8c', marginLeft: 8 }}>
                                                        {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
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
                                                placeholder="Nhập câu trả lời..."
                                                rows={3}
                                            />
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <Button size="small" onClick={() => { setReplyingTo(null); setReplyText('') }}>Hủy</Button>
                                                <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleReply(thread.id)} disabled={!replyText.trim() || isReplying}>Gửi</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button size="small" onClick={() => setReplyingTo(thread.id)} style={{ marginTop: 8 }} icon={<CommentOutlined />}>Trả lời</Button>
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
        <div style={styles.root}>
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
                            <div style={styles.sectionLabel}>Ngày nộp</div>
                            <div style={styles.metadataRow}>
                                <CalendarOutlined />
                                <Typography.Text>{submittedDate}</Typography.Text>
                            </div>
                        </div>

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>Lĩnh vực</div>
                            <Typography.Text style={styles.sectionContent}>{trackName}</Typography.Text>
                        </div>

                        {/* Abstract */}
                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>Tóm tắt</div>
                            <Typography.Text style={styles.sectionContent}>{article.abstract}</Typography.Text>
                        </div>

                        {/* Conclusion */}
                        {article.conclusion && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>Kết luận</div>
                                <Typography.Text style={styles.sectionContent}>{article.conclusion}</Typography.Text>
                            </div>
                        )}

                        {/* Authors */}
                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>Tác giả</div>
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
                                <div style={styles.sectionLabel}>Người phản biện</div>
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
                                                <Tag key={reviewer.id} icon={<UserOutlined />}>Bạn</Tag>
                                            ))
                                    ) : (
                                        // Researchers see anonymized stable reviewer numbering.
                                        article.reviewers.map((reviewer, index) => (
                                            <Tag key={reviewer.id} icon={<UserOutlined />}>Người phản biện {reviewer.displayIndex ?? index + 1}</Tag>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {renderStructuredReviewPanel()}

                        {/* Initial Review Note */}
                        {article.initialReviewNote && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>Ghi chú ban đầu</div>
                                <Typography.Text style={styles.sectionContent}>{article.initialReviewNote}</Typography.Text>
                            </div>
                        )}

                        {/* Initial Review Next Steps */}
                        {article.initialReviewNextSteps && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>Các bước tiếp theo</div>
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
                            <div style={styles.sectionLabel}>Ngày nộp</div>
                            <div style={styles.metadataRow}>
                                <CalendarOutlined />
                                <Typography.Text>{submittedDate}</Typography.Text>
                            </div>
                        </div>

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>Lĩnh vực</div>
                            <Typography.Text style={styles.sectionContent}>{trackName}</Typography.Text>
                        </div>

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>Tóm tắt</div>
                            <Typography.Text style={styles.sectionContent}>{article.abstract}</Typography.Text>
                        </div>

                        {article.conclusion && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>Kết luận</div>
                                <Typography.Text style={styles.sectionContent}>{article.conclusion}</Typography.Text>
                            </div>
                        )}

                        <div style={styles.sectionBlock}>
                            <div style={styles.sectionLabel}>Tác giả</div>
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
                                <div style={styles.sectionLabel}>Người phản biện</div>
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
                                                <Tag key={reviewer.id} icon={<UserOutlined />}>Bạn</Tag>
                                            ))
                                    ) : (
                                        article.reviewers.map((reviewer, index) => (
                                            <Tag key={reviewer.id} icon={<UserOutlined />}>Người phản biện {reviewer.displayIndex ?? index + 1}</Tag>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {renderStructuredReviewPanel()}

                        {article.initialReviewNote && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>Ghi chú ban đầu</div>
                                <Typography.Text style={styles.sectionContent}>{article.initialReviewNote}</Typography.Text>
                            </div>
                        )}

                        {article.initialReviewNextSteps && (
                            <div style={styles.sectionBlock}>
                                <div style={styles.sectionLabel}>Các bước tiếp theo</div>
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
                        {pdfUrl && pdfUrl.startsWith('http') && (
                            <Button
                                type="primary"
                                icon={<FilePdfOutlined />}
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
                                        type="primary"
                                        icon={<CheckOutlined />}
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
                                        danger
                                        icon={<CloseOutlined />}
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
                            <Button type="primary" onClick={() => navigate(`/articles/${articleId}?view=initialReview`)} size="small">Đánh giá ban đầu</Button>
                        )}
                        {canManageReviewers && (
                            <Button onClick={() => setIsInviteReviewersOpen(true)} size="small">Quản lý reviewer</Button>
                        )}
                        {isAssignedReviewer && (
                            <Button type="primary" onClick={() => navigate(`/articles/${articleId}?view=review`)} size="small">Phản biện bài báo</Button>
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
                                {isStartingRevisions ? 'Đang xử lý...' : 'Nộp Bài Sửa Chữa'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* PDF Viewer */}
                <PdfViewer fileUrl={pdfUrl} emptyMessage="Không có bài báo để xem" />
            </div>

            {/* Mobile Sidebar Toggle */}
            <Button
                style={{ ...styles.sidebarToggle, display: isMobile ? 'block' : 'none' }}
                type="primary"
                shape="circle"
                size="large"
                icon={<MenuOutlined />}
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                title={isSidebarVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
            />

            {/* Comments Section - Desktop */}
            <div style={{ ...(styles.commentsSection as object), ...(isMobile ? { display: 'none' } : (!isCommentsPanelVisible ? styles.commentsSectionHidden : {})) }}>
                <div style={styles.commentsHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CommentOutlined style={{ fontSize: 18 }} />
                        <Typography.Text strong>Nhận xét ({commentThreads.length})</Typography.Text>
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
                    title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text strong>Nhận xét</Typography.Text>
                        <Button icon={<CloseOutlined />} onClick={() => setIsCommentsDialogOpen(false)} />
                    </div>}
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
                title={isMobile ? (isCommentsDialogOpen ? 'Ẩn nhận xét' : 'Hiện nhận xét') : (isCommentsPanelVisible ? 'Ẩn nhận xét' : 'Hiện nhận xét')}
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
