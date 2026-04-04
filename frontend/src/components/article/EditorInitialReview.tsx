import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Button, Typography, Input, Modal, Radio, Select, Spin, Form, Grid, theme as antdTheme } from 'antd'
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    MenuOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons'
import { PdfViewer, TableOfContents } from '../common'
import type { TocItem } from '../common'
import { useParams, useNavigate } from 'react-router'
import { useArticle, useInitialReview } from '../../hooks/useArticles'
import { useUsers } from '../../hooks/useUser'
import { useInstitutions } from '../../hooks/useInstitutionTrack'
import { articleService } from '../../services/article.service'
import { articleVersionService } from '../../services/article-version.service'
import { attachmentService } from '../../services/attachment.service'
import { useBasicToast } from '../../hooks/useBasicToast'
import { InitialReviewDecision, ArticleStatus } from '../../constants'
import { AttachmentKind } from '../../constants/attachment-kind'
import { AttachmentStatus } from '../../constants/attachment-status'
import type { ArticleVersionDto, VersionSupplementDto } from '../../models'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

const styles = {
    root: {
        display: 'flex',
        height: 'calc(100vh - 64px)',
        width: '100%',
        overflow: 'hidden',
        flexDirection: 'row' as const,
        position: 'relative' as const,
        background: 'var(--initial-review-bg, transparent)',
    },
    tocSection: {
        width: '280px',
        flexShrink: 0,
        borderRight: '1px solid var(--initial-review-border, #f0f0f0)',
        background: 'var(--initial-review-panel-bg, transparent)',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 1002,
    },
    tocSectionMobile: {
        position: 'fixed' as const,
        left: 0,
        top: 64,
        height: 'calc(100vh - 64px)',
        boxShadow: 'var(--initial-review-mobile-shadow, 0 8px 24px rgba(0,0,0,0.15))',
    },
    tocSectionHidden: {
        transform: 'translateX(-100%)',
    },
    articleInfo: {
        padding: '16px',
        borderBottom: '1px solid var(--initial-review-border, #f0f0f0)',
        background: 'var(--initial-review-panel-bg, transparent)',
        flexShrink: 0,
    },
    infoCol: {
        marginBottom: '8px',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    infoLabel: {
        marginBottom: '4px',
        color: 'var(--initial-review-text-secondary, inherit)',
    },
    viewerSection: {
        flex: 1,
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden',
    },
    viewerHeader: {
        padding: '16px',
        borderBottom: '1px solid var(--initial-review-border, #f0f0f0)',
        background: 'var(--initial-review-panel-bg, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        flexWrap: 'wrap' as const,
    },
    tocToggleButton: {
        position: 'fixed' as const,
        bottom: '24px',
        left: '24px',
        zIndex: 1001,
    },
    overlay: {
        position: 'fixed' as const,
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--initial-review-overlay, rgba(0,0,0,0.45))',
        zIndex: 1000,
    },
} as const

function EditorInitialReview() {
    const { t, i18n } = useTranslation('common')
    const { token } = antdTheme.useToken()
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.lg
    const reviewThemeVars = useMemo(() => ({
        '--initial-review-bg': token.colorBgLayout,
        '--initial-review-panel-bg': token.colorBgContainer,
        '--initial-review-border': token.colorBorderSecondary,
        '--initial-review-overlay': token.colorBgMask,
        '--initial-review-mobile-shadow': token.boxShadowSecondary,
        '--initial-review-text-secondary': token.colorTextSecondary,
    }) as React.CSSProperties, [token])

    const navigate = useNavigate()
    const { success, error: showError } = useBasicToast()

    // State management
    const [tocData, setTocData] = useState<TocItem[]>([])
    const [jumpToPage, setJumpToPage] = useState<number | null>(null)

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const [rejectReason, setRejectReason] = useState('')
    const [acceptReason, setAcceptReason] = useState('')
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
    const [isTocVisible, setIsTocVisible] = useState<boolean>(true)
    const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
    const [isAssigningReviewers, setIsAssigningReviewers] = useState(false)
    const [reviewerEntryMode, setReviewerEntryMode] = useState<'existing' | 'manual'>('existing')
    const [manualReviewerName, setManualReviewerName] = useState('')
    const [manualReviewerEmail, setManualReviewerEmail] = useState('')
    const [manualReviewerInstitutionId, setManualReviewerInstitutionId] = useState('')
    const [versions, setVersions] = useState<ArticleVersionDto[]>([])
    const [currentVersion, setCurrentVersion] = useState<number>(1)
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
    const [downloadingSupplementId, setDownloadingSupplementId] = useState<string | null>(null)

    const pdfDocumentRef = useRef<unknown>(null)
    const params = useParams<{ articleId: string }>()
    const articleId = params.articleId
    const safeArticleId = articleId ?? ''
    const { data: articleResponse, isLoading, isError, error } = useArticle(articleId, !!articleId)
    const article = articleResponse?.data
    const { mutate: submitInitialReview, isPending: isSubmittingDecision } = useInitialReview(safeArticleId)
    
    // Fetch users with REVIEWER role
    const { data: usersResponse } = useUsers(0, 100, { role: 'REVIEWER' })
    const reviewerUsers = useMemo(() => usersResponse?.data?.content ?? [], [usersResponse])
    
    // Fetch institutions for manual reviewer entry
    const { data: institutionsResponse } = useInstitutions(0, 100)
    const institutions = useMemo(() => institutionsResponse?.data?.content ?? [], [institutionsResponse])
    
    const centeredStateStyles = {
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column' as const,
        gap: '12px',
        padding: '24px',
        textAlign: 'center' as const,
    }
    const dateTimeLocale = i18n.language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'

    useEffect(() => {
        document.title = `${t('articleDetails.initialReview')} - Research Review`
    }, [t])

    useEffect(() => {
        setIsTocVisible(!isMobile)
    }, [isMobile])

    useEffect(() => {
        if (!article?.id) return
        let cancelled = false

        void (async () => {
            setIsLoadingMaterials(true)
            try {
                const response = await articleVersionService.listVersions(article.id)
                const loadedVersions = response.data ?? []

                if (cancelled) return

                if (loadedVersions.length > 0) {
                    setVersions(loadedVersions)
                    const latestVersion = Math.max(...loadedVersions.map((versionItem) => versionItem.versionNumber))
                    setCurrentVersion(latestVersion)
                    return
                }

                const attachmentsResponse = await attachmentService.listArticleAttachments(article.id)
                const attachments = attachmentsResponse.data ?? []
                const supplements = attachments
                    .filter((attachment) => attachment.kind === AttachmentKind.SUPPLEMENTAL && attachment.status === AttachmentStatus.AVAILABLE)
                    .sort((first, second) => {
                        const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0
                        const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0
                        return secondTime - firstTime
                    })

                const fallbackVersion: ArticleVersionDto = {
                    id: `${article.id}-v1-fallback`,
                    articleId: article.id,
                    versionNumber: 1,
                    supplements: supplements.map((attachment): VersionSupplementDto => ({
                        id: attachment.id,
                        fileName: attachment.fileName,
                        fileSize: attachment.fileSize,
                        mimeType: attachment.mimeType,
                        kind: attachment.kind,
                        status: attachment.status,
                        createdAt: attachment.createdAt ?? '',
                        createdBy: attachment.createdBy ?? '',
                    })),
                }

                if (!cancelled) {
                    setVersions([fallbackVersion])
                    setCurrentVersion(1)
                }
            } catch {
                if (!cancelled) {
                    setVersions([])
                    setCurrentVersion(1)
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingMaterials(false)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [article?.id])

    const statusLabels: Record<string, string> = {
        [ArticleStatus.SUBMITTED]: t('notifications.articleStatus.submitted'),
        [ArticleStatus.PENDING_REVIEW]: t('notifications.articleStatus.pendingReview'),
        [ArticleStatus.IN_REVIEW]: t('notifications.articleStatus.inReview'),
        [ArticleStatus.REJECT_REQUESTED]: t('notifications.articleStatus.rejectRequested'),
        [ArticleStatus.REJECTED]: t('notifications.articleStatus.rejected'),
        [ArticleStatus.ACCEPTED]: t('notifications.articleStatus.accepted'),
    }

    const formatDate = (value?: string) => {
        if (!value) return t('editorInitialReview.notUpdated')
        return new Date(value).toLocaleString(dateTimeLocale)
    }

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

    if (!articleId) {
        return (
            <div style={centeredStateStyles}>
                <Text strong style={{ fontSize: '18px' }}>{t('editorInitialReview.notFoundTitle')}</Text>
                <Text type='secondary'>
                    {t('editorInitialReview.invalidPath')}
                </Text>
            </div>
        )
    }

    if (isError) {
        const errorMessage = error instanceof Error ? error.message : t('editorInitialReview.loadFailed')
        return (
            <div style={centeredStateStyles}>
                <Text strong style={{ fontSize: '18px' }}>{t('editorInitialReview.errorTitle')}</Text>
                <Text type='danger'>
                    {errorMessage}
                </Text>
            </div>
        )
    }

    if (isLoading && !article) {
        return (
            <div style={centeredStateStyles}>
                <Spin size="large" tip={t('editorInitialReview.loadingArticle')} />
            </div>
        )
    }

    if (!article) {
        return (
            <div style={centeredStateStyles}>
                <Text strong style={{ fontSize: '18px' }}>{t('editorInitialReview.notFoundTitle')}</Text>
                <Text type='secondary'>
                    {t('editorInitialReview.notFoundDescription')}
                </Text>
            </div>
        )
    }

    // Handle clicking on TOC item
    const handleTocClick = (pageNumber: number) => {
        setJumpToPage(pageNumber)
        setTimeout(() => setJumpToPage(null), 100)
        // Auto-close TOC on mobile after clicking
        if (isMobile) {
            setIsTocVisible(false)
        }
    }

    // Handle overlay click to close TOC on mobile
    const handleOverlayClick = () => {
        if (isTocVisible) {
            setIsTocVisible(false)
        }
    }

    const handleReject = () => {
        if (!rejectReason.trim() || !articleId) return
        submitInitialReview({
            decision: InitialReviewDecision.REJECT,
            note: rejectReason.trim(),
        }, {
            onSuccess: () => {
                setIsRejectDialogOpen(false)
                setRejectReason('')
            },
        })
    }

    const handleAccept = async () => {
        if (!articleId) return
        
        // Validation
        if (reviewerEntryMode === 'existing' && selectedReviewers.length === 0) {
            showError(t('editorInitialReview.errors.selectAtLeastOneReviewer'))
            return
        }
        
        if (reviewerEntryMode === 'manual') {
            if (!manualReviewerName.trim() || !manualReviewerEmail.trim() || !manualReviewerInstitutionId) {
                showError(t('editorInitialReview.errors.completeReviewerInfo'))
                return
            }
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(manualReviewerEmail.trim())) {
                showError(t('editorInitialReview.errors.invalidEmail'))
                return
            }
        }
        
        const note = acceptReason.trim() || t('editorInitialReview.accept.defaultNote')
        
        submitInitialReview({
            decision: InitialReviewDecision.SEND_TO_REVIEW,
            note,
        }, {
            onSuccess: async () => {
                // Assign reviewers
                setIsAssigningReviewers(true)
                try {
                    if (reviewerEntryMode === 'existing') {
                        // Assign existing users
                        for (const reviewerId of selectedReviewers) {
                            const reviewer = reviewerUsers.find(u => u.id === reviewerId)
                            if (reviewer) {
                                await articleService.assignReviewer(articleId, {
                                    name: reviewer.name || reviewer.email,
                                    email: reviewer.email,
                                    institutionId: reviewer.institution?.id || '',
                                    articleId: articleId,
                                    userId: reviewer.id,
                                })
                            }
                        }
                    } else {
                        // Assign manual entry reviewer
                        await articleService.assignReviewer(articleId, {
                            name: manualReviewerName.trim(),
                            email: manualReviewerEmail.trim(),
                            institutionId: manualReviewerInstitutionId,
                            articleId: articleId,
                        })
                    }
                    success(t('editorInitialReview.accept.success'))
                    setIsAcceptDialogOpen(false)
                    setAcceptReason('')
                    setSelectedReviewers([])
                    setManualReviewerName('')
                    setManualReviewerEmail('')
                    setManualReviewerInstitutionId('')
                    navigate(`/articles/${articleId}`)
                } catch (err) {
                    showError(t('editorInitialReview.accept.inviteFailedPrefix') + (err as Error).message)
                } finally {
                    setIsAssigningReviewers(false)
                }
            },
        })
    }

    const authorNames = article.authors?.map(author => author.name).join(', ') || t('editorInitialReview.notUpdated')
    const trackName = article.track?.name ?? t('editorInitialReview.unassigned')
    const submittedDate = formatDate(article.createdAt)
    const statusLabel = statusLabels[article.status] ?? article.status
    const selectedVersionData = versions.find((versionItem) => versionItem.versionNumber === currentVersion)

    const handleDownloadSupplement = async (supplement: VersionSupplementDto) => {
        if (!supplement.id) return
        setDownloadingSupplementId(supplement.id)
        try {
            const blob = await articleVersionService.downloadSupplementFile(supplement.id)
            const objectUrl = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = objectUrl
            anchor.download = supplement.fileName
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            URL.revokeObjectURL(objectUrl)
        } catch (error) {
            showError(error instanceof Error ? error.message : t('articleDetails.loadMaterialsFailed'))
        } finally {
            setDownloadingSupplementId(null)
        }
    }

    return (
        <div style={{ ...styles.root, ...reviewThemeVars }}>
            {/* Overlay for mobile when TOC is visible */}
            {isMobile && isTocVisible && (
                <div style={styles.overlay} onClick={handleOverlayClick} />
            )}

            {/* Table of Contents Section */}
            <div
                style={{
                    ...styles.tocSection,
                    ...(isMobile ? styles.tocSectionMobile : {}),
                    ...(!isTocVisible ? styles.tocSectionHidden : {}),
                }}
            >
                {/* Article Info */}
                <div style={styles.articleInfo}>
                    <div style={styles.infoCol}>
                        <Text type='secondary' style={styles.infoLabel}>
                            {t('editorInitialReview.info.articleTitle')}
                        </Text>
                        <Text strong style={{ display: 'block' }}>
                            {article.title}
                        </Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text type='secondary' style={styles.infoLabel}>
                            {t('editorInitialReview.info.authors')}
                        </Text>
                        <Text>
                            {authorNames}
                        </Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text type='secondary' style={styles.infoLabel}>
                            {t('editorInitialReview.info.submittedDate')}
                        </Text>
                        <Text>
                            {submittedDate}
                        </Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text type='secondary' style={styles.infoLabel}>
                            {t('editorInitialReview.info.track')}
                        </Text>
                        <Text>{trackName}</Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text type='secondary' style={styles.infoLabel}>
                            {t('editorInitialReview.info.currentStatus')}
                        </Text>
                        <Text>
                            {statusLabel}
                        </Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text type='secondary' style={styles.infoLabel}>
                            {t('articleDetails.supplements')}
                        </Text>
                        {isLoadingMaterials ? (
                            <Spin size='small' />
                        ) : (selectedVersionData?.supplements?.length ?? 0) === 0 ? (
                            <Text type='secondary'>{t('articleDetails.noSupplements')}</Text>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedVersionData?.supplements.map((supplement) => (
                                    <Button
                                        key={supplement.id}
                                        size='small'
                                        style={{ textAlign: 'left' }}
                                        onClick={() => {
                                            void handleDownloadSupplement(supplement)
                                        }}
                                        disabled={downloadingSupplementId === supplement.id}
                                    >
                                        {supplement.fileName}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* TOC */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    <TableOfContents 
                        items={tocData}
                        onItemClick={handleTocClick}
                        onClose={isMobile ? () => setIsTocVisible(false) : undefined}
                        emptyMessage={t('toc.empty')}
                    />
                </div>
            </div>

            {/* PDF Viewer Section */}
            <div style={styles.viewerSection}>
                {/* Header with Decision Buttons */}
                <div style={styles.viewerHeader}>
                    <Button
                        type="text"
                        icon={isTocVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                        onClick={() => setIsTocVisible(!isTocVisible)}
                    >
                        {isTocVisible ? t('editorInitialReview.actions.hideInfo') : t('editorInitialReview.actions.showInfo')}
                    </Button>
                    <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        danger
                        onClick={() => setIsRejectDialogOpen(true)}
                    >
                        {t('editorInitialReview.actions.reject')}
                    </Button>

                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        disabled={isSubmittingDecision}
                        onClick={() => setIsAcceptDialogOpen(true)}
                    >
                        {t('editorInitialReview.actions.acceptAndInvite')}
                    </Button>
                </div>

                {/* PDF Viewer */}
                <PdfViewer
                    fileUrl={(() => {
                        if (!article?.id) return null
                        const proxyUrl = `${apiBaseUrl}/articles/${article.id}/pdf`
                        const link = (article.link ?? '').trim()
                        if (!link) return proxyUrl
                        if (link.includes('X-Amz-') || link.includes('x-amz-')) return proxyUrl
                        if (link.endsWith(`/articles/${article.id}/pdf`)) return link
                        return link
                    })()}
                    emptyMessage={t('editorInitialReview.noPdf')}
                    onDocumentLoadSuccess={handleDocumentLoadSuccess}
                    jumpToPage={jumpToPage}
                />
            </div>

            {/* Floating Button for Mobile */}
            {isMobile && (
                <Button
                    style={styles.tocToggleButton}
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<MenuOutlined />}
                    onClick={() => setIsTocVisible(!isTocVisible)}
                    title={isTocVisible ? t('editorInitialReview.actions.hideInfo') : t('editorInitialReview.actions.showInfo')}
                />
            )}

            {/* Reject Dialog */}
            <Modal
                title={t('editorInitialReview.reject.title')}
                open={isRejectDialogOpen}
                onCancel={() => setIsRejectDialogOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsRejectDialogOpen(false)}>
                        {t('editorInitialReview.common.backStep')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleReject}
                        disabled={!rejectReason.trim()}
                        loading={isSubmittingDecision}
                    >
                        {t('editorInitialReview.reject.confirm')}
                    </Button>,
                ]}
            >
                <div style={{ marginBottom: '12px' }}>
                    <Text style={{ display: 'block', marginBottom: '12px' }}>
                        {t('editorInitialReview.reject.reasonLabel')} <Text type='danger'>*</Text>
                    </Text>
                    <Text type='secondary' style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                        {t('editorInitialReview.reject.reasonHint')}
                    </Text>
                    <Input.TextArea
                        placeholder={t('editorInitialReview.reject.reasonPlaceholder')}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={6}
                    />
                </div>
            </Modal>

            {/* Accept Dialog */}
            <Modal
                title={t('editorInitialReview.accept.title')}
                open={isAcceptDialogOpen}
                onCancel={() => setIsAcceptDialogOpen(false)}
                width={600}
                footer={[
                    <Button key="cancel" onClick={() => setIsAcceptDialogOpen(false)}>
                        {t('editorInitialReview.common.backStep')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleAccept}
                        disabled={
                            isSubmittingDecision || 
                            isAssigningReviewers || 
                            (reviewerEntryMode === 'existing' && selectedReviewers.length === 0) ||
                            (reviewerEntryMode === 'manual' && (!manualReviewerName.trim() || !manualReviewerEmail.trim() || !manualReviewerInstitutionId))
                        }
                        loading={isAssigningReviewers}
                    >
                        {t('editorInitialReview.common.confirm')}
                    </Button>,
                ]}
            >
                <Text style={{ display: 'block', marginBottom: '12px' }}>
                    {t('editorInitialReview.accept.confirmMessage')}
                </Text>
                
                <Form.Item label={t('editorInitialReview.accept.inviteMethodLabel')} style={{ marginBottom: '16px' }}>
                    <Radio.Group
                        value={reviewerEntryMode}
                        onChange={(e) => setReviewerEntryMode(e.target.value as 'existing' | 'manual')}
                    >
                        <Radio value="existing">{t('editorInitialReview.accept.existingMethod')}</Radio>
                        <Radio value="manual">{t('editorInitialReview.accept.manualMethod')}</Radio>
                    </Radio.Group>
                </Form.Item>
                
                {reviewerEntryMode === 'existing' ? (
                    <Form.Item
                        label={t('editorInitialReview.accept.selectReviewerLabel')}
                        required
                        style={{ marginBottom: '12px' }}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t('editorInitialReview.accept.selectReviewerPlaceholder')}
                            value={selectedReviewers}
                            onChange={setSelectedReviewers}
                            options={reviewerUsers.map((user) => ({
                                value: user.id,
                                label: `${user.name} (${user.email})${user.institution?.name ? ` - ${user.institution.name}` : ''}`,
                            }))}
                        />
                    </Form.Item>
                ) : (
                    <>
                        <Form.Item label={t('editorInitialReview.accept.manualNameLabel')} required style={{ marginBottom: '12px' }}>
                            <Input
                                placeholder={t('editorInitialReview.accept.manualNamePlaceholder')}
                                value={manualReviewerName}
                                onChange={(e) => setManualReviewerName(e.target.value)}
                            />
                        </Form.Item>
                        
                        <Form.Item label={t('editorInitialReview.accept.manualEmailLabel')} required style={{ marginBottom: '12px' }}>
                            <Input
                                type="email"
                                placeholder={t('editorInitialReview.accept.manualEmailPlaceholder')}
                                value={manualReviewerEmail}
                                onChange={(e) => setManualReviewerEmail(e.target.value)}
                            />
                        </Form.Item>
                        
                        <Form.Item label={t('editorInitialReview.accept.manualInstitutionLabel')} required style={{ marginBottom: '12px' }}>
                            <Select
                                placeholder={t('editorInitialReview.accept.manualInstitutionPlaceholder')}
                                value={manualReviewerInstitutionId || undefined}
                                onChange={(value) => setManualReviewerInstitutionId(value)}
                                options={institutions.map((institution) => ({
                                    value: institution.id,
                                    label: institution.name,
                                }))}
                            />
                        </Form.Item>
                    </>
                )}
                
                <Text type='secondary' style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                    {t('editorInitialReview.accept.noteHint')}
                </Text>
                <Input.TextArea
                    placeholder={t('editorInitialReview.accept.notePlaceholder')}
                    value={acceptReason}
                    onChange={(e) => setAcceptReason(e.target.value)}
                    rows={4}
                />
            </Modal>
        </div>
    )
}

export default EditorInitialReview
