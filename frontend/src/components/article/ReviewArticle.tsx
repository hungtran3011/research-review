import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
    Button as AntButton,
    Typography,
    Input,
    Card as AntCard,
    Tag,
    Select,
    Modal,
    Spin,
    theme as antdTheme,
} from 'antd'
import {
    CommentOutlined as CommentRegular,
    CloseOutlined as DismissRegular,
    CheckOutlined as CheckmarkRegular,
    MenuFoldOutlined as PanelRightContractRegular,
    MenuUnfoldOutlined as PanelRightExpandRegular,
    OrderedListOutlined as NavigationRegular,
    FileOutlined as DocumentRegular,
} from '@ant-design/icons'
import { PdfViewer, TableOfContents } from '../common'
import type { TocItem } from '../common'
import { CommentStatus } from '../../constants'
import type { CommentStatusType } from '../../constants'
import { ArticleStatus } from '../../constants'
import { useParams } from 'react-router'
import { useArticle } from '../../hooks/useArticles'
import { useArticleComments, useCreateComment, useUpdateCommentStatus } from '../../hooks/useComments'
import { useReplyComment } from '../../hooks/useComments'
import { useAuthStore } from '../../stores/authStore'
import { useCurrentUser } from '../../hooks/useUser'
import { useMyStructuredReview, useSubmitStructuredReview } from '../../hooks/useStructuredReviews'
import { ReviewRecommendation } from '../../models'
import { articleVersionService } from '../../services/article-version.service'
import { AttachmentKind } from '../../constants/attachment-kind'
import type { AttachmentKindType } from '../../constants/attachment-kind'
import { AttachmentStatus } from '../../constants/attachment-status'
import type { ArticleVersionDto, VersionSupplementDto } from '../../models'
import { useTranslation } from 'react-i18next'
import './ReviewArticle.css'

const sizeToFontPx: Record<number, number> = {
    100: 12,
    200: 13,
    300: 14,
    400: 16,
    500: 20,
}

const Button = ({
    appearance,
    icon,
    children,
    size,
    shape,
    ...rest
}: {
    appearance?: 'primary' | 'secondary' | 'subtle'
    icon?: React.ReactNode
    children?: React.ReactNode
    size?: 'small' | 'medium' | 'large'
    shape?: 'circular'
    [key: string]: unknown
}) => {
    const antType = appearance === 'primary' ? 'primary' : 'default'
    const antSize = size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'
    return (
        <AntButton
            {...(rest as object)}
            type={antType}
            size={antSize}
            icon={icon as React.ReactNode}
            shape={shape === 'circular' ? 'circle' : 'default'}
        >
            {shape === 'circular' ? null : children}
        </AntButton>
    )
}

const Text = ({ children, weight, size, style }: { children?: React.ReactNode; weight?: 'semibold'; size?: number; style?: React.CSSProperties }) => (
    <Typography.Text style={{ fontWeight: weight === 'semibold' ? 600 : undefined, fontSize: size ? sizeToFontPx[size] : undefined, ...(style ?? {}) }}>
        {children}
    </Typography.Text>
)

const Textarea = ({ value, onChange, rows, placeholder, resize, disabled }: {
    value?: string
    onChange?: (_event: unknown, data: { value: string }) => void
    rows?: number
    placeholder?: string
    resize?: 'vertical'
    disabled?: boolean
}) => (
    <Input.TextArea
        value={value}
        rows={rows}
        placeholder={placeholder}
        autoSize={resize === 'vertical' ? { minRows: rows, maxRows: rows ? Math.max(rows, rows + 4) : 8 } : undefined}
        disabled={disabled}
        onChange={(event) => onChange?.(event, { value: event.target.value })}
    />
)

const Card = ({ children, className, style, onClick }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) => (
    <AntCard className={className} style={style} onClick={onClick} bodyStyle={{ padding: 12 }}>
        {children}
    </AntCard>
)

const Badge = ({ children, color, appearance, style }: { children?: React.ReactNode; color?: 'warning' | 'success' | 'informative' | 'brand'; appearance?: 'filled' | 'outline'; size?: 'small'; style?: React.CSSProperties }) => {
    const colorMap: Record<string, string> = {
        warning: 'orange',
        success: 'green',
        informative: 'blue',
        brand: 'geekblue',
    }
    const tagColor = color ? colorMap[color] ?? 'default' : undefined
    void appearance
    return <Tag color={tagColor} style={style}>{children}</Tag>
}

const Option = (props: { value: string; text?: string; children?: React.ReactNode; disabled?: boolean }) => {
    void props
    return null
}

const Dropdown = ({
    children,
    placeholder,
    value,
    onOptionSelect,
    selectedOptions,
    disabled,
}: {
    children?: React.ReactNode
    placeholder?: string
    value?: string
    onOptionSelect?: (_event: unknown, data: { optionValue?: string }) => void
    selectedOptions?: string[]
    disabled?: boolean
}) => {
    const options = React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child) => {
            const props = child.props as { value: string; text?: string; children?: React.ReactNode; disabled?: boolean }
            return {
                value: props.value,
                label: props.text ?? props.children,
                disabled: props.disabled,
            }
        })

    return (
        <Select
            placeholder={placeholder}
            value={selectedOptions?.[0] ?? value}
            options={options}
            disabled={disabled}
            onChange={(next) => onOptionSelect?.(null, { optionValue: String(next) })}
            style={{ minWidth: 180 }}
        />
    )
}

const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange?: (_event: unknown, data: { open: boolean }) => void; children?: React.ReactNode }) => (
    <Modal open={open} onCancel={() => onOpenChange?.(null, { open: false })} footer={null} destroyOnClose>
        {children}
    </Modal>
)

const DialogSurface = ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div>
const DialogBody = ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div>
const DialogTitle = ({ children }: { children?: React.ReactNode }) => <Typography.Title level={4} style={{ margin: 0 }}>{children}</Typography.Title>
const DialogContent = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => <div style={style}>{children}</div>
const Spinner = ({ size, label }: { size?: 'small' | 'large'; label?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Spin size={size === 'small' ? 'small' : 'large'} />
        {label ? <Text size={200}>{label}</Text> : null}
    </div>
)

const useStyles = () => ({
    root: 'review-root',
    tocWrapper: 'review-tocWrapper',
    tocWrapperHidden: 'review-tocWrapperHidden',
    viewerSection: 'review-viewerSection',
    viewerHeader: 'review-viewerHeader',
    commentsSection: 'review-commentsSection',
    commentsSectionCollapsed: 'review-commentsSectionCollapsed',
    commentsSectionHidden: 'review-commentsSectionHidden',
    commentsDialogSurface: 'review-commentsDialogSurface',
    commentsDialogBody: 'review-commentsDialogBody',
    commentsHeader: 'review-commentsHeader',
    commentsList: 'review-commentsList',
    commentCard: 'review-commentCard',
    commentCardSelected: 'review-commentCardSelected',
    commentHeader: 'review-commentHeader',
    commentMeta: 'review-commentMeta',
    commentContent: 'review-commentContent',
    commentActions: 'review-commentActions',
    newCommentForm: 'review-newCommentForm',
    annotationMarker: 'review-annotationMarker',
    highlightOverlay: 'review-highlightOverlay',
    floatingButton: 'review-floatingButton',
    tocToggleButton: 'review-tocToggleButton',
    commentsToggleButton: 'review-commentsToggleButton',
    overlay: 'review-overlay',
    structuredForm: 'review-structuredForm',
    scoreRow: 'review-scoreRow',
    attachmentsBar: 'review-attachmentsBar',
    attachmentsList: 'review-attachmentsList',
    numberInput: 'review-numberInput',
})

type CommentItem = {
    id: string
    version: number
    pageNumber: number
    status: CommentStatusType
    content: string
    author: string
    createdAt?: Date
    section?: string
    selectedText?: string
}

type VersionView = {
    version: number
    fileUrl: string | null
    uploadedAt: string
    uploadedBy: string
    mainAttachment?: VersionSupplementDto
    supplements: VersionSupplementDto[]
}

function ReviewArticle() {
    const { t, i18n } = useTranslation('common')
    const { token } = antdTheme.useToken()
    const tokens = useMemo(() => ({
        shadow16: token.boxShadowSecondary,
        shadow8: token.boxShadow,
        shadow4: token.boxShadowTertiary,
        colorNeutralStroke1: token.colorBorderSecondary,
        colorNeutralStroke2: token.colorBorder,
        colorNeutralBackground1: token.colorBgContainer,
        colorNeutralBackground2: token.colorBgLayout,
        colorNeutralBackground3: token.colorFillTertiary,
        colorNeutralForeground1: token.colorText,
        colorNeutralForeground3: token.colorTextSecondary,
        colorPaletteDarkOrangeForeground1: token.colorWarning,
        colorPaletteYellowBackground2: token.colorWarningBg,
        colorPaletteYellowBorder2: token.colorWarningBorder,
    }), [token])

    const reviewThemeVars = useMemo(() => ({
        '--review-bg': token.colorBgLayout,
        '--review-panel-bg': token.colorBgContainer,
        '--review-muted-bg': token.colorFillQuaternary,
        '--review-border-color': token.colorBorderSecondary,
        '--review-input-border': token.colorBorder,
        '--review-input-bg': token.colorBgContainer,
        '--review-input-text': token.colorText,
        '--review-overlay-bg': token.colorBgMask,
        '--review-shadow-hover': token.boxShadow,
        '--review-shadow-selected': token.boxShadowSecondary,
        '--review-mobile-shadow': token.boxShadowSecondary,
    }) as React.CSSProperties, [token])

    const classes = useStyles()
    const dateTimeLocale = i18n.language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'

    // State management
    const params = useParams<{ articleId: string }>()
    const articleId = params.articleId
    const safeArticleId = articleId ?? ''
    const {
        data: articleResponse,
        isLoading: isArticleLoading,
        isError: isArticleError,
        error: articleError,
    } = useArticle(articleId, !!articleId)
    const article = articleResponse?.data
    const {
        data: commentsResponse,
        isLoading: isCommentsLoading,
        isError: isCommentsError,
        error: commentsError,
    } = useArticleComments(articleId, !!articleId)
    const { mutate: createComment, isPending: isCreatingComment } = useCreateComment(safeArticleId)
    const { mutate: updateCommentStatus, isPending: isUpdatingCommentStatus } = useUpdateCommentStatus(safeArticleId)
    const { mutate: replyToComment, isPending: isReplying } = useReplyComment(safeArticleId)
    const { data: myStructuredReviewResponse } = useMyStructuredReview(articleId, !!articleId)
    const { mutate: submitStructuredReview, isPending: isSubmittingStructuredReview } = useSubmitStructuredReview(safeArticleId)
    const myStructuredReview = myStructuredReviewResponse?.data
    const { data: currentUserData } = useCurrentUser()
    const currentUserId = currentUserData?.data?.id
    const currentUserName = currentUserData?.data?.name
    const reviewerName = useAuthStore((state) => state.email) ?? t('reviewArticle.reviewer')
    const [versions, setVersions] = useState<VersionView[]>([])
    const [currentVersion, setCurrentVersion] = useState<number>(1)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [tocData, setTocData] = useState<TocItem[]>([])
    const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null)
    const [newCommentText, setNewCommentText] = useState('')
    const [isAddingComment, setIsAddingComment] = useState(false)
    const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({})
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null)
    const [selectedText, setSelectedText] = useState<string>('')
    const [jumpToPage, setJumpToPage] = useState<number | null>(null)
    const [currentPdfPage, setCurrentPdfPage] = useState<number>(1)
    const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
    const [isTocVisible, setIsTocVisible] = useState<boolean>(!initialIsMobile)
    const [isCommentsVisible, setIsCommentsVisible] = useState<boolean>(!initialIsMobile)
    const [isMobile, setIsMobile] = useState<boolean>(initialIsMobile)
    const [isStructuredDialogOpen, setIsStructuredDialogOpen] = useState(false)
    const [structuredRecommendation, setStructuredRecommendation] = useState<keyof typeof ReviewRecommendation>('BORDERLINE')
    const [structuredSummary, setStructuredSummary] = useState('')
    const [structuredConfidentialRemarks, setStructuredConfidentialRemarks] = useState('')
    const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null)
    const [structuredScores, setStructuredScores] = useState<Record<string, number>>({
        originality: 6,
        technical_quality: 6,
        clarity: 6,
        relevance: 6,
        overall: 6,
    })

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

    const buildPdfProxyUrl = useCallback((id: string, version?: number) => {
        const base = `${apiBaseUrl}/articles/${id}/pdf`
        if (version == null) return base
        return `${base}?version=${encodeURIComponent(String(version))}`
    }, [apiBaseUrl])

    const pdfDocumentRef = useRef<unknown>(null)
    const commentThreads = useMemo(() => commentsResponse?.data ?? [], [commentsResponse])
    const commentItems = useMemo<CommentItem[]>(() => {
        return commentThreads.map(thread => {
            const latest = thread.comments[thread.comments.length - 1]
            const createdAtSource = latest?.createdAt ?? thread.updatedAt ?? thread.createdAt
            const isMine = !!currentUserId && (latest?.createdBy === currentUserId || latest?.authorId === currentUserId)
            return {
                id: thread.id,
                version: thread.version,
                pageNumber: thread.pageNumber,
                status: thread.status,
                content: latest?.content ?? '',
                author: isMine ? t('reviewArticle.you') : (latest?.authorName ?? t('reviewArticle.reviewer')),
                createdAt: createdAtSource ? new Date(createdAtSource) : new Date(),
                section: thread.section ?? undefined,
                selectedText: thread.selectedText ?? undefined,
            }
        })
    }, [commentThreads, currentUserId, t])

    const isMyComment = useCallback((comment?: { createdBy?: string | null; authorId?: string | null } | null) => {
        if (!comment || !currentUserId) return false
        return comment.createdBy === currentUserId || comment.authorId === currentUserId
    }, [currentUserId])

    const displayAuthorName = useCallback((comment: { authorName: string; createdBy?: string | null; authorId?: string | null }) => {
        return isMyComment(comment) ? t('reviewArticle.you') : comment.authorName
    }, [isMyComment, t])

    const isStructuredReviewSubmitted = !!myStructuredReview?.submittedAt
    const canSubmitStructuredReview = !!article && (
        article.status === ArticleStatus.IN_REVIEW || article.status === ArticleStatus.REVIEWS_COMPLETED
    )

    const kindLabels: Record<string, string> = {
        [AttachmentKind.SUBMISSION]: t('reviewArticle.attachmentKinds.submission'),
        [AttachmentKind.REVISION]: t('reviewArticle.attachmentKinds.revision'),
        [AttachmentKind.SUPPLEMENTAL]: t('reviewArticle.attachmentKinds.supplemental'),
    }

    const selectedVersionData = useMemo(
        () => versions.find((versionData) => versionData.version === currentVersion) ?? null,
        [versions, currentVersion],
    )

    const versionAttachments = useMemo(() => {
        if (!selectedVersionData) return []
        const attachments: Array<{ kind: AttachmentKindType; fileName: string; fileSize: number; id: string }> = []
        if (selectedVersionData.mainAttachment) {
            attachments.push({
                kind: selectedVersionData.mainAttachment.kind,
                fileName: selectedVersionData.mainAttachment.fileName,
                fileSize: selectedVersionData.mainAttachment.fileSize,
                id: selectedVersionData.mainAttachment.id,
            })
        }
        selectedVersionData.supplements.forEach((supplement) => {
            attachments.push({
                kind: supplement.kind,
                fileName: supplement.fileName,
                fileSize: supplement.fileSize,
                id: supplement.id,
            })
        })
        return attachments
    }, [selectedVersionData])

    const formatFileSize = useCallback((bytes: number) => {
        if (!bytes || bytes <= 0) return t('reviewArticle.fileSize.zero')
        const units = t('reviewArticle.fileSize.units', { returnObjects: true }) as string[]
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
        const value = bytes / Math.pow(1024, index)
        return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
    }, [t])

    const triggerBrowserDownload = useCallback((blob: Blob, fileName: string) => {
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = fileName
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(objectUrl)
    }, [])

    const handleDownloadAttachment = useCallback(async (attachment: { id: string; kind: AttachmentKindType; fileName: string }) => {
        if (!article?.id || !attachment.id) return
        setDownloadingAttachmentId(attachment.id)
        try {
            const blob = attachment.kind === AttachmentKind.SUPPLEMENTAL
                ? await articleVersionService.downloadSupplementFile(attachment.id)
                : await articleVersionService.downloadMainFile(article.id, currentVersion)
            triggerBrowserDownload(blob, attachment.fileName)
        } catch (downloadError) {
            console.error('Cannot download attachment', downloadError)
        } finally {
            setDownloadingAttachmentId(null)
        }
    }, [article?.id, currentVersion, triggerBrowserDownload])

    useEffect(() => {
        if (!myStructuredReview) return

        setStructuredRecommendation(myStructuredReview.recommendation)
        setStructuredSummary(myStructuredReview.summaryNotes ?? '')
        setStructuredConfidentialRemarks(myStructuredReview.confidentialRemarks ?? '')
        const nextScores: Record<string, number> = {
            originality: 6,
            technical_quality: 6,
            clarity: 6,
            relevance: 6,
            overall: 6,
        }
        myStructuredReview.scores.forEach((item) => {
            nextScores[item.criterion] = item.score
        })
        setStructuredScores(nextScores)
    }, [myStructuredReview])

    const setScore = useCallback((criterion: string, nextValue: number) => {
        const bounded = Math.max(1, Math.min(10, nextValue))
        setStructuredScores((prev) => ({ ...prev, [criterion]: bounded }))
    }, [])

    const submitStructuredForm = useCallback((finalSubmit: boolean) => {
        if (!canSubmitStructuredReview) return
        if (finalSubmit && isStructuredReviewSubmitted) return
        if (!structuredSummary.trim()) {
            window.alert(t('reviewArticle.alerts.summaryRequired'))
            return
        }

        submitStructuredReview({
            recommendation: structuredRecommendation,
            summaryNotes: structuredSummary.trim(),
            finalSubmit,
            confidentialRemarks: structuredConfidentialRemarks.trim() || null,
            scores: [
                { criterion: 'originality', score: structuredScores.originality },
                { criterion: 'technical_quality', score: structuredScores.technical_quality },
                { criterion: 'clarity', score: structuredScores.clarity },
                { criterion: 'relevance', score: structuredScores.relevance },
                { criterion: 'overall', score: structuredScores.overall },
            ],
        }, {
            onSuccess: () => {
                if (finalSubmit) {
                    setIsStructuredDialogOpen(false)
                }
            },
        })
    }, [
        canSubmitStructuredReview,
        isStructuredReviewSubmitted,
        structuredConfidentialRemarks,
        structuredRecommendation,
        structuredScores.clarity,
        structuredScores.originality,
        structuredScores.overall,
        structuredScores.relevance,
        structuredScores.technical_quality,
        structuredSummary,
        submitStructuredReview,
        t,
    ])

    const handleReplyToThread = (threadId: string) => {
        if (!replyText.trim() || !articleId) return

        replyToComment(
            {
                threadId,
                data: {
                    content: replyText,
                    authorName: currentUserName ?? reviewerName,
                    authorId: currentUserId,
                },
            },
            {
                onSuccess: () => {
                    setReplyText('')
                    setReplyingTo(null)
                    setExpandedThreads((prev) => ({ ...prev, [threadId]: true }))
                },
            },
        )
    }

    useEffect(() => {
        if (!article?.id) return

        let cancelled = false

        ;(async () => {
            const fallbackDate = article.updatedAt ?? article.createdAt ?? new Date().toISOString()
            const baseVersions: VersionView[] = [
                {
                    version: 1,
                    fileUrl: buildPdfProxyUrl(article.id, 1),
                    uploadedAt: fallbackDate,
                    uploadedBy: article.createdBy ?? t('reviewArticle.system'),
                    supplements: [],
                },
            ]

            try {
                const versionResp = await articleVersionService.listVersions(article.id)
                const backendVersions = versionResp.data ?? []
                const mappedVersions: VersionView[] = backendVersions
                    .map((versionItem: ArticleVersionDto) => ({
                        version: versionItem.versionNumber,
                        fileUrl: buildPdfProxyUrl(article.id, versionItem.versionNumber),
                        uploadedAt: versionItem.submittedAt ?? versionItem.mainAttachment?.createdAt ?? fallbackDate,
                        uploadedBy: versionItem.submittedBy ?? versionItem.mainAttachment?.createdBy ?? t('reviewArticle.system'),
                        mainAttachment: versionItem.mainAttachment,
                        supplements: (versionItem.supplements ?? [])
                            .filter((item) => item.status === AttachmentStatus.AVAILABLE),
                    }))
                    .sort((a, b) => a.version - b.version)

                const versionList = mappedVersions.length > 0 ? mappedVersions : baseVersions

                if (cancelled) return
                setVersions(versionList)
                const latestVersion = versionList[versionList.length - 1]
                setCurrentVersion(latestVersion?.version ?? 1)
                setPdfUrl(latestVersion?.fileUrl ?? null)
            } catch {
                if (cancelled) return
                setVersions(baseVersions)
                setCurrentVersion(1)
                setPdfUrl(baseVersions[0]?.fileUrl ?? null)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [article?.id, article?.createdAt, article?.updatedAt, article?.createdBy, buildPdfProxyUrl, t])

    // Track mobile/desktop view
    useEffect(() => {
        const handleResize = () => {
            const nextIsMobile = window.innerWidth <= 1024
            setIsMobile((prev) => {
                if (prev === nextIsMobile) return prev

                if (nextIsMobile) {
                    setIsTocVisible(false)
                    setIsCommentsVisible(false)
                } else {
                    setIsTocVisible(true)
                    setIsCommentsVisible(true)
                }

                return nextIsMobile
            })

            // On desktop, always restore side panels.
            // (On mobile we have floating toggles; on desktop those toggles are hidden.)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Capture text selection from PDF
    useEffect(() => {
        const handleTextSelection = () => {
            const selection = window.getSelection()
            if (selection && selection.toString().trim().length > 0) {
                setSelectedText(selection.toString().trim())
            }
        }

        document.addEventListener('mouseup', handleTextSelection)
        return () => document.removeEventListener('mouseup', handleTextSelection)
    }, [])

    // Parse TOC items recursively
    const parseTocItems = useCallback(async (items: unknown[], pdf: unknown): Promise<TocItem[]> => {
        const parsed: TocItem[] = []
        const pdfDoc = pdf as {
            getDestination: (dest: string) => Promise<unknown>
            getPageIndex: (ref: unknown) => Promise<number>
        }
        
        for (const item of items) {
            const tocEntry = item as {
                title: string
                dest?: string | unknown[]
                items?: unknown[]
            }
            
            try {
                let pageNumber = 1
                if (tocEntry.dest) {
                    const dest = typeof tocEntry.dest === 'string'
                        ? await pdfDoc.getDestination(tocEntry.dest)
                        : tocEntry.dest
                    
                    const destArray = dest as unknown[]
                    if (destArray && destArray[0]) {
                        const pageIndex = await pdfDoc.getPageIndex(destArray[0])
                        pageNumber = pageIndex + 1
                    }
                }
                
                const tocItem: TocItem = {
                    title: tocEntry.title,
                    pageNumber,
                }
                
                if (tocEntry.items && tocEntry.items.length > 0) {
                    tocItem.items = await parseTocItems(tocEntry.items, pdf)
                }
                
                parsed.push(tocItem)
            } catch (error) {
                console.error('Error parsing TOC item:', error)
            }
        }
        
        return parsed
    }, [])

    // Load TOC when PDF loads
    const handleDocumentLoadSuccess = useCallback(async (pdf: unknown) => {
        pdfDocumentRef.current = pdf
        const pdfDoc = pdf as { getOutline: () => Promise<unknown[] | null> }
        
        try {
            const outline = await pdfDoc.getOutline()
            if (outline) {
                const parsedToc = await parseTocItems(outline, pdf)
                setTocData(parsedToc)
            }
        } catch (error) {
            console.error('Error loading TOC:', error)
        }
    }, [parseTocItems])

    // Handle version change
    const handleVersionChange = (version: number) => {
        setCurrentVersion(version)
        const versionData = versions.find(v => v.version === version)
        if (!versionData) return

        setPdfUrl(versionData.fileUrl ?? buildPdfProxyUrl(article?.id ?? '', version))
    }

    // Filter comments - show all comments from this version and earlier versions
    const versionComments = useMemo(() => {
        return commentItems
            .filter(c => c.version <= currentVersion)
            .sort((a, b) => {
                if (b.version !== a.version) {
                    return b.version - a.version
                }
                const timeA = a.createdAt?.getTime() ?? 0
                const timeB = b.createdAt?.getTime() ?? 0
                return timeB - timeA
            })
    }, [commentItems, currentVersion])

    const versionThreads = useMemo(() => {
        return commentThreads
            .filter((t) => (t.version ?? 0) <= currentVersion)
            .sort((a, b) => {
                const versionDiff = (b.version ?? 0) - (a.version ?? 0)
                if (versionDiff !== 0) return versionDiff
                const timeA = new Date((a.updatedAt ?? a.createdAt ?? '') || 0).getTime()
                const timeB = new Date((b.updatedAt ?? b.createdAt ?? '') || 0).getTime()
                return timeB - timeA
            })
    }, [commentThreads, currentVersion])

    // Handle adding new comment
    const handleAddComment = () => {
        if (!newCommentText.trim() || !articleId) return

        createComment({
            content: newCommentText,
            authorName: reviewerName,
            version: currentVersion,
            pageNumber: currentPdfPage,
            x: selectedPosition?.x ?? 0,
            y: selectedPosition?.y ?? 0,
            selectedText: selectedText || undefined,
            section: getSectionForPage(currentPdfPage),
        }, {
            onSuccess: () => {
                setNewCommentText('')
                setIsAddingComment(false)
                setSelectedPosition(null)
                setSelectedText('')
            }
        })
    }

    // Handle comment status change
    const handleCommentStatusChange = (commentId: string, status: CommentStatusType) => {
        if (!articleId) return
        updateCommentStatus({ threadId: commentId, data: { status } })
    }

    // Handle clicking on TOC item
    const handleTocClick = (pageNumber: number) => {
        setJumpToPage(pageNumber)
        // Reset after a brief moment to allow for re-clicking the same page
        setTimeout(() => setJumpToPage(null), 100)
        // Auto-close TOC on mobile after clicking
        if (window.innerWidth <= 1024) {
            setIsTocVisible(false)
        }
    }

    // Get section name based on page number
    const getSectionForPage = useCallback((pageNumber: number): string | undefined => {
        const findSection = (items: TocItem[]): string | undefined => {
            for (let i = 0; i < items.length; i++) {
                const current = items[i]
                const next = items[i + 1]
                
                // If this is the exact page, return this section
                if (current.pageNumber === pageNumber) {
                    return current.title
                }
                
                // If page is between this section and the next, it belongs to current
                if (next) {
                    if (pageNumber >= current.pageNumber && pageNumber < next.pageNumber) {
                        // Check nested items first
                        if (current.items) {
                            const nestedSection = findSection(current.items)
                            if (nestedSection) return nestedSection
                        }
                        return current.title
                    }
                } else {
                    // This is the last section, check if page is after it
                    if (pageNumber >= current.pageNumber) {
                        if (current.items) {
                            const nestedSection = findSection(current.items)
                            if (nestedSection) return nestedSection
                        }
                        return current.title
                    }
                }
                
                // Check nested items
                if (current.items) {
                    const nestedSection = findSection(current.items)
                    if (nestedSection) return nestedSection
                }
            }
            return undefined
        }
        
        return findSection(tocData)
    }, [tocData])

    // Get status badge
    const getStatusBadge = (status: CommentStatusType) => {
        const config: Record<CommentStatusType, { color: 'warning' | 'success' | 'informative' | 'brand'; text: string }> = {
            [CommentStatus.OPEN]: { color: 'warning', text: t('reviewArticle.commentStatus.open') },
            [CommentStatus.RESOLVED]: { color: 'success', text: t('reviewArticle.commentStatus.resolved') },
            [CommentStatus.ADDRESSED]: { color: 'informative', text: t('reviewArticle.commentStatus.addressed') },
        }
        const { color, text } = config[status] ?? config[CommentStatus.OPEN]
        return <Badge appearance="filled" color={color}>{text}</Badge>
    }

    // Handle overlay click to close TOC on mobile
    const handleOverlayClick = () => {
        if (isMobile && isTocVisible) {
            setIsTocVisible(false)
        }
    }

    const centeredStateStyles = {
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        padding: '24px',
        textAlign: 'center',
    } as const

    if (!articleId) {
        return (
            <div style={centeredStateStyles}>
                <Text weight="semibold" size={400}>{t('reviewArticle.states.notFoundTitle')}</Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                    {t('reviewArticle.states.invalidPath')}
                </Text>
            </div>
        )
    }

    if (isArticleError) {
        const errorMessage = articleError instanceof Error ? articleError.message : t('reviewArticle.states.loadArticleFailed')
        return (
            <div style={centeredStateStyles}>
                <Text weight="semibold" size={400}>{t('reviewArticle.states.errorTitle')}</Text>
                <Text size={300} style={{ color: tokens.colorPaletteDarkOrangeForeground1 }}>
                    {errorMessage}
                </Text>
            </div>
        )
    }

    if (isArticleLoading && !article) {
        return (
            <div style={centeredStateStyles}>
                <Spinner size="large" label={t('reviewArticle.states.loadingArticle')} />
            </div>
        )
    }

    if (!article) {
        return (
            <div style={centeredStateStyles}>
                <Text weight="semibold" size={400}>{t('reviewArticle.states.notFoundTitle')}</Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                    {t('reviewArticle.states.notFoundDescription')}
                </Text>
            </div>
        )
    }

    // Render comments content (reusable for both desktop and mobile)
    const renderCommentsContent = () => (
        <>
            <div className={classes.commentsHeader}>
                <Text weight="semibold" size={400}>
                    {t('reviewArticle.comments.title', { count: versionComments.length })}
                </Text>
                <Dropdown
                    placeholder={t('reviewArticle.comments.versionPlaceholder')}
                    value={t('reviewArticle.comments.versionValue', { version: currentVersion })}
                    onOptionSelect={(_, data) => {
                        if (data.optionValue) {
                            handleVersionChange(Number(data.optionValue))
                        }
                    }}
                >
                    {versions.length === 0 ? (
                        <Option value="0" disabled>
                            {t('reviewArticle.comments.noVersion')}
                        </Option>
                    ) : (
                        versions.map(v => (
                            <Option key={v.version} value={v.version.toString()} text={t('reviewArticle.comments.versionText', { version: v.version })}>
                                {t('reviewArticle.comments.versionWithDate', {
                                    version: v.version,
                                    date: new Date(v.uploadedAt).toLocaleDateString(dateTimeLocale),
                                })}
                            </Option>
                        ))
                    )}
                </Dropdown>
            </div>

            <div className={classes.commentsList}>
                {isCommentsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                        <Spinner size="small" label={t('reviewArticle.comments.loading')} />
                    </div>
                ) : isCommentsError ? (
                    <Text style={{ textAlign: 'center', color: tokens.colorPaletteDarkOrangeForeground1 }}>
                        {(commentsError instanceof Error ? commentsError.message : t('reviewArticle.comments.loadFailed'))}
                    </Text>
                ) : versionThreads.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                        {t('reviewArticle.comments.emptyForVersion')}
                    </Text>
                ) : (
                    versionComments.map(comment => {
                        const thread = versionThreads.find((t) => t.id === comment.id)
                        const rootComment = thread?.comments?.[0]
                        const displayedAuthor = rootComment ? displayAuthorName(rootComment) : comment.author
                        const displayedContent = rootComment?.content ?? comment.content
                        const displayedCreatedAt = rootComment?.createdAt ? new Date(rootComment.createdAt) : comment.createdAt
                        const repliesCount = thread?.comments?.length ? Math.max(0, thread.comments.length - 1) : 0
                        const isExpanded = !!expandedThreads[comment.id]
                        return (
                        <Card
                            key={comment.id}
                            className={`${classes.commentCard} ${
                                selectedComment?.id === comment.id ? classes.commentCardSelected : ''
                            }`}
                            onClick={() => setSelectedComment(comment)}
                        >
                            <div className={classes.commentHeader}>
                                <div style={{ flex: 1 }}>
                                    <Text weight="semibold" size={300}>
                                        {displayedAuthor}
                                    </Text>
                                    <Badge
                                        appearance="outline"
                                        color={comment.version === currentVersion ? "brand" : "informative"}
                                        size="small"
                                        style={{ marginLeft: '8px' }}
                                    >
                                        {comment.version === currentVersion
                                            ? t('reviewArticle.comments.currentVersionBadge', { version: comment.version })
                                            : t('reviewArticle.comments.versionBadge', { version: comment.version })}
                                    </Badge>
                                </div>
                                {getStatusBadge(comment.status)}
                            </div>

                            <div className={classes.commentMeta}>
                                {comment.section && (
                                    <>
                                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                            {comment.section}
                                        </Text>
                                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                            •
                                        </Text>
                                    </>
                                )}
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    {t('reviewArticle.comments.page', { page: comment.pageNumber })}
                                </Text>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    •
                                </Text>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    {displayedCreatedAt?.toLocaleString(dateTimeLocale)}
                                </Text>
                            </div>

                            {comment.selectedText && (
                                <div style={{
                                    padding: '8px',
                                    borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}`,
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontStyle: 'italic',
                                }}>
                                    "{comment.selectedText}"
                                </div>
                            )}

                            <div className={classes.commentContent}>
                                <Text size={300}>{displayedContent}</Text>
                            </div>

                            {thread && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                    <Button
                                        size="small"
                                        appearance="subtle"
                                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                                            e.stopPropagation()
                                            setExpandedThreads((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                                        }}
                                    >
                                        {isExpanded
                                            ? t('reviewArticle.comments.hideReplies')
                                            : repliesCount > 0
                                                ? t('reviewArticle.comments.viewRepliesCount', { count: repliesCount })
                                                : t('reviewArticle.comments.viewReplies')}
                                    </Button>
                                    <Button
                                        size="small"
                                        appearance="subtle"
                                        icon={<CommentRegular />}
                                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                                            e.stopPropagation()
                                            setExpandedThreads((prev) => ({ ...prev, [comment.id]: true }))
                                            setReplyingTo(comment.id)
                                        }}
                                    >
                                        {t('reviewArticle.comments.reply')}
                                    </Button>
                                </div>
                            )}

                            {thread && isExpanded && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        paddingLeft: '12px',
                                        borderLeft: `2px solid ${tokens.colorNeutralStroke2}`,
                                    }}>
                                        {(thread.comments ?? []).slice(1).length === 0 ? (
                                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                                {t('reviewArticle.comments.noReplies')}
                                            </Text>
                                        ) : (
                                            (thread.comments ?? []).slice(1).map((c) => (
                                                <div
                                                    key={c.id}
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                                        <Text weight="semibold" size={200}>
                                                            {displayAuthorName(c)}
                                                        </Text>
                                                        {c.createdAt && (
                                                            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                                                                {new Date(c.createdAt).toLocaleString(dateTimeLocale)}
                                                            </Text>
                                                        )}
                                                    </div>
                                                    <Text size={300} style={{ display: 'block', marginTop: '4px' }}>
                                                        {c.content}
                                                    </Text>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {replyingTo === thread.id && (
                                        <div className={classes.newCommentForm} style={{ marginTop: '12px' }}>
                                            <Text weight="semibold" size={300}>{t('reviewArticle.comments.replyFormTitle')}</Text>
                                            <Textarea
                                                placeholder={t('reviewArticle.comments.replyPlaceholder')}
                                                value={replyText}
                                                onChange={(_, data) => setReplyText(data.value)}
                                                rows={3}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Button
                                                    appearance="primary"
                                                    onClick={() => handleReplyToThread(thread.id)}
                                                    disabled={!replyText.trim() || isReplying}
                                                >
                                                    {isReplying ? t('reviewArticle.comments.sending') : t('reviewArticle.comments.send')}
                                                </Button>
                                                <Button
                                                    appearance="subtle"
                                                    onClick={() => {
                                                        setReplyingTo(null)
                                                        setReplyText('')
                                                    }}
                                                >
                                                    {t('reviewArticle.common.cancel')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={classes.commentActions}>
                                <Button
                                    size="small"
                                    appearance="subtle"
                                    icon={<CheckmarkRegular />}
                                    onClick={(e: React.MouseEvent<HTMLElement>) => {
                                        e.stopPropagation()
                                        handleCommentStatusChange(comment.id, CommentStatus.RESOLVED)
                                    }}
                                    disabled={isUpdatingCommentStatus}
                                >
                                    {t('reviewArticle.comments.resolve')}
                                </Button>
                                <Button
                                    size="small"
                                    appearance="subtle"
                                    icon={<DismissRegular />}
                                    onClick={(e: React.MouseEvent<HTMLElement>) => {
                                        e.stopPropagation()
                                        handleCommentStatusChange(comment.id, CommentStatus.ADDRESSED)
                                    }}
                                    disabled={isUpdatingCommentStatus}
                                >
                                    {t('reviewArticle.comments.markAddressed')}
                                </Button>
                            </div>
                        </Card>
                        )
                    })
                )}
            </div>

            {isAddingComment && (
                <div className={classes.newCommentForm}>
                    <Text weight="semibold" size={300}>{t('reviewArticle.comments.newCommentTitle')}</Text>
                    
                    {selectedText && (
                        <div style={{
                            padding: '8px',
                            borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}`,
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontStyle: 'italic',
                        }}>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                {t('reviewArticle.comments.selectedTextLabel')}
                            </Text>
                            <Text size={300} style={{ display: 'block', marginTop: '4px' }}>
                                "{selectedText}"
                            </Text>
                        </div>
                    )}
                    
                    <div style={{
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                    }}>
                        {getSectionForPage(currentPdfPage) && (
                            <Text size={200} style={{ display: 'block', marginBottom: '4px' }}>
                                {t('reviewArticle.comments.section')}: <strong>{getSectionForPage(currentPdfPage)}</strong>
                            </Text>
                        )}
                        <Text size={200}>
                            {t('reviewArticle.comments.pageLabel')}: <strong>{currentPdfPage}</strong>
                        </Text>
                    </div>
                    
                    <Textarea
                        placeholder={t('reviewArticle.comments.newCommentPlaceholder')}
                        value={newCommentText}
                        onChange={(_, data) => setNewCommentText(data.value)}
                        rows={4}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button appearance="primary" onClick={handleAddComment} disabled={isCreatingComment}>
                            {isCreatingComment ? t('reviewArticle.comments.posting') : t('reviewArticle.comments.post')}
                        </Button>
                        <Button
                            appearance="subtle"
                            onClick={() => {
                                setIsAddingComment(false)
                                setNewCommentText('')
                                setSelectedText('')
                            }}
                        >
                            {t('reviewArticle.common.cancel')}
                        </Button>
                    </div>
                </div>
            )}
        </>
    )

    return (
        <div className={classes.root} style={reviewThemeVars}>
            {/* Overlay for mobile when TOC is visible */}
            {isMobile && isTocVisible && (
                <div className={classes.overlay} onClick={handleOverlayClick} />
            )}

            {/* Table of Contents Section */}
            <div className={`${classes.tocWrapper} ${!isTocVisible ? classes.tocWrapperHidden : ''}`}>
                <TableOfContents 
                    items={tocData}
                    onItemClick={handleTocClick}
                    onClose={() => setIsTocVisible(false)}
                />
            </div>

            {/* PDF Viewer Section */}
            <div className={classes.viewerSection}>
                <div className={classes.viewerHeader}>
                    <Text weight="semibold" size={500}>
                        {t('reviewArticle.title')}
                    </Text>
                    <Button
                        appearance="primary"
                        icon={<CommentRegular />}
                        onClick={() => {
                            setIsAddingComment(true)
                            setIsCommentsVisible(true)
                        }}
                    >
                        {t('reviewArticle.actions.addComment')}
                    </Button>
                    <Button
                        appearance="secondary"
                        icon={<DocumentRegular />}
                        disabled={
                            isSubmittingStructuredReview ||
                            isArticleLoading ||
                            !article ||
                            !canSubmitStructuredReview ||
                            isStructuredReviewSubmitted
                        }
                        onClick={() => setIsStructuredDialogOpen(true)}
                    >
                        {isStructuredReviewSubmitted ? t('reviewArticle.actions.submittedReview') : t('reviewArticle.actions.structuredReviewTemplate')}
                    </Button>
                    {myStructuredReview?.submittedAt && (
                        <Text size={200}>
                            {t('reviewArticle.submittedAt', { date: new Date(myStructuredReview.submittedAt).toLocaleString(dateTimeLocale) })}
                        </Text>
                    )}
                    <Button
                        className={classes.commentsToggleButton}
                        appearance="subtle"
                        icon={isCommentsVisible ? <PanelRightContractRegular /> : <PanelRightExpandRegular />}
                        onClick={() => setIsCommentsVisible(!isCommentsVisible)}
                    >
                        {isCommentsVisible ? t('reviewArticle.actions.hideComments') : t('reviewArticle.actions.showComments')}
                    </Button>
                </div>
                <div className={classes.attachmentsBar}>
                    <Text size={200} weight="semibold">{t('reviewArticle.attachments.title')}</Text>
                    {versionAttachments.length === 0 ? (
                        <Text size={200}>{t('reviewArticle.attachments.empty')}</Text>
                    ) : (
                        <div className={classes.attachmentsList}>
                            {versionAttachments.map((attachment) => (
                                <Button
                                    key={attachment.id}
                                    appearance="secondary"
                                    size="small"
                                    icon={<DocumentRegular />}
                                    onClick={() => handleDownloadAttachment(attachment)}
                                    disabled={downloadingAttachmentId === attachment.id}
                                >
                                    {kindLabels[attachment.kind] ?? attachment.kind} • {attachment.fileName} ({formatFileSize(attachment.fileSize)})
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
                <PdfViewer
                    fileUrl={pdfUrl}
                    emptyMessage={t('reviewArticle.states.noPdf')}
                    onDocumentLoadSuccess={handleDocumentLoadSuccess}
                    jumpToPage={jumpToPage}
                    onPageChange={setCurrentPdfPage}
                />

                <Dialog open={isStructuredDialogOpen} onOpenChange={(_, data) => setIsStructuredDialogOpen(data.open)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>{t('reviewArticle.structured.title')}</DialogTitle>
                            <DialogContent>
                                <div className={classes.structuredForm}>
                                    <Text size={200}>{t('reviewArticle.structured.scoreHint')}</Text>
                                    {[
                                        { key: 'originality', label: t('reviewArticle.structured.criteria.originality') },
                                        { key: 'technical_quality', label: t('reviewArticle.structured.criteria.technicalQuality') },
                                        { key: 'clarity', label: t('reviewArticle.structured.criteria.clarity') },
                                        { key: 'relevance', label: t('reviewArticle.structured.criteria.relevance') },
                                        { key: 'overall', label: t('reviewArticle.structured.criteria.overall') },
                                    ].map((criterion) => (
                                        <div key={criterion.key} className={classes.scoreRow}>
                                            <Text>{criterion.label}</Text>
                                            <input
                                                className={classes.numberInput}
                                                type="number"
                                                min={1}
                                                max={10}
                                                step={1}
                                                value={structuredScores[criterion.key] ?? 6}
                                                onChange={(event) => setScore(criterion.key, Number(event.target.value))}
                                                disabled={isSubmittingStructuredReview || isStructuredReviewSubmitted}
                                            />
                                        </div>
                                    ))}

                                    <Text>{t('reviewArticle.structured.recommendationLabel')}</Text>
                                    <Dropdown
                                        value={structuredRecommendation}
                                        selectedOptions={[structuredRecommendation]}
                                        onOptionSelect={(_, data) => {
                                            const nextValue = data.optionValue as keyof typeof ReviewRecommendation | undefined
                                            if (!nextValue) return
                                            setStructuredRecommendation(nextValue)
                                        }}
                                        disabled={isSubmittingStructuredReview || isStructuredReviewSubmitted}
                                    >
                                        {Object.keys(ReviewRecommendation).map((value) => (
                                            <Option key={value} value={value}>
                                                {value}
                                            </Option>
                                        ))}
                                    </Dropdown>

                                    <Text>{t('reviewArticle.structured.summaryLabel')}</Text>
                                    <Textarea
                                        value={structuredSummary}
                                        onChange={(_, data) => setStructuredSummary(data.value)}
                                        placeholder={t('reviewArticle.structured.summaryPlaceholder')}
                                        resize="vertical"
                                        rows={4}
                                        disabled={isSubmittingStructuredReview || isStructuredReviewSubmitted}
                                    />

                                    <Text>{t('reviewArticle.structured.confidentialLabel')}</Text>
                                    <Textarea
                                        value={structuredConfidentialRemarks}
                                        onChange={(_, data) => setStructuredConfidentialRemarks(data.value)}
                                        placeholder={t('reviewArticle.structured.confidentialPlaceholder')}
                                        resize="vertical"
                                        rows={3}
                                        disabled={isSubmittingStructuredReview || isStructuredReviewSubmitted}
                                    />

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                        <Button appearance="subtle" onClick={() => setIsStructuredDialogOpen(false)}>
                                            {t('reviewArticle.common.close')}
                                        </Button>
                                        <Button
                                            appearance="secondary"
                                            onClick={() => submitStructuredForm(false)}
                                            disabled={isSubmittingStructuredReview || isStructuredReviewSubmitted}
                                        >
                                            {t('reviewArticle.structured.saveDraft')}
                                        </Button>
                                        <Button
                                            appearance="primary"
                                            icon={<CheckmarkRegular />}
                                            onClick={() => submitStructuredForm(true)}
                                            disabled={isSubmittingStructuredReview || isStructuredReviewSubmitted}
                                        >
                                            {isSubmittingStructuredReview ? t('reviewArticle.comments.sending') : t('reviewArticle.structured.submitReview')}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            </div>

            {/* Comments Section - Desktop */}
            <div className={`${classes.commentsSection} ${
                !isCommentsVisible ? classes.commentsSectionHidden : ''
            }`}>
                {renderCommentsContent()}
            </div>

            {/* Comments Dialog - Mobile */}
            {isMobile && (
                <Dialog
                    open={isCommentsVisible}
                    onOpenChange={(_, data) => setIsCommentsVisible(data.open)}
                >
                    <DialogSurface className={classes.commentsDialogSurface}>
                        <DialogBody className={classes.commentsDialogBody}>
                            <DialogTitle>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text weight="semibold" size={500}>
                                        {t('reviewArticle.comments.modalTitle')}
                                    </Text>
                                    <Button
                                        appearance="subtle"
                                        icon={<DismissRegular />}
                                        onClick={() => setIsCommentsVisible(false)}
                                    />
                                </div>
                            </DialogTitle>
                            <DialogContent style={{ 
                                flex: 1, 
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: 0,
                            }}>
                                {renderCommentsContent()}
                            </DialogContent>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}

            {/* Floating Buttons for Mobile */}
            {isMobile && (
                <>
                    <Button
                        className={classes.tocToggleButton}
                        appearance="primary"
                        shape="circular"
                        size="large"
                        icon={<NavigationRegular />}
                        onClick={() => setIsTocVisible(!isTocVisible)}
                        title={isTocVisible ? t('reviewArticle.actions.hideToc') : t('reviewArticle.actions.showToc')}
                    />

                    <Button
                        className={classes.floatingButton}
                        appearance="primary"
                        shape="circular"
                        size="large"
                        icon={<CommentRegular />}
                        onClick={() => setIsCommentsVisible(!isCommentsVisible)}
                        title={isCommentsVisible ? t('reviewArticle.actions.hideComments') : t('reviewArticle.actions.showComments')}
                    />
                </>
            )}
        </div>
    )
}

export default ReviewArticle
