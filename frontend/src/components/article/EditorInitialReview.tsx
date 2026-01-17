import { useState, useCallback, useRef, useMemo } from 'react'
import {
    makeStyles,
    Button,
    Text,
    Textarea,
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    tokens,
    Spinner,
    Combobox,
    Option,
    Field,
    Input,
    RadioGroup,
    Radio,
} from '@fluentui/react-components'
import {
    CheckmarkCircleRegular,
    DismissCircleRegular,
    NavigationRegular,
    PanelLeftContractRegular,
    PanelLeftExpandRegular,
} from '@fluentui/react-icons'
import { PdfViewer, TableOfContents } from '../common'
import type { TocItem } from '../common'
import { useParams, useNavigate } from 'react-router'
import { useArticle, useInitialReview } from '../../hooks/useArticles'
import { useUsers } from '../../hooks/useUser'
import { useInstitutions } from '../../hooks/useInstitutionTrack'
import { articleService } from '../../services/article.service'
import { useBasicToast } from '../../hooks/useBasicToast'
import { InitialReviewDecision, ArticleStatus } from '../../constants'

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
    // Table of Contents Section
    tocSection: {
        width: '280px',
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
    tocSectionHidden: {
        '@media (max-width: 1024px)': {
            transform: 'translateX(-100%)',
        },
        '@media (min-width: 1025px)': {
            transform: 'translateX(-100%)',
        },
    },
    articleInfo: {
        padding: '16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground1,
        flexShrink: 0,
    },
    infoCol: {
        marginBottom: '8px',
        display: 'flex',
        flexDirection: 'column'
    },
    infoLabel: {
        color: tokens.colorNeutralForeground3,
        marginBottom: '4px',
    },
    tocHeader: {
        padding: '16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
    },
    tocList: {
        flex: 1,
        overflow: 'auto',
        padding: '8px',
    },
    tocItem: {
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: '4px',
        marginBottom: '4px',
        transition: 'background-color 0.2s',
        display: 'flex',
        width: '100%',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
        ':first-child': {
            flex:1
        }
    },
    tocItemNested: {
        marginLeft: '16px',
        fontSize: '13px',
    },
    // PDF Viewer Section
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
        justifyContent: 'flex-end',
        gap: '12px',
        flexWrap: 'wrap',
    },
    tocToggleButton: {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 1001,
        boxShadow: tokens.shadow16,
        '@media (min-width: 1025px)': {
            display: 'none',
        },
    },
    tocToggleButtonDesktop: {
        '@media (max-width: 1024px)': {
            display: 'none',
        },
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
})

function EditorInitialReview() {
    const classes = useStyles()
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
        flexDirection: 'column',
        gap: '12px',
        padding: '24px',
        textAlign: 'center',
    } as const

    const statusLabels: Record<string, string> = {
        [ArticleStatus.SUBMITTED]: 'Đã gửi',
        [ArticleStatus.PENDING_REVIEW]: 'Chờ phản biện',
        [ArticleStatus.IN_REVIEW]: 'Đang phản biện',
        [ArticleStatus.REJECT_REQUESTED]: 'Đang xem xét loại bỏ',
        [ArticleStatus.REJECTED]: 'Đã từ chối',
        [ArticleStatus.ACCEPTED]: 'Đã chấp nhận',
    }

    const formatDate = (value?: string) => {
        if (!value) return 'Chưa cập nhật'
        return new Date(value).toLocaleString('vi-VN')
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
                <Text weight="semibold" size={400}>Không tìm thấy bài báo</Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                    Đường dẫn không hợp lệ.
                </Text>
            </div>
        )
    }

    if (isError) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin bài báo.'
        return (
            <div style={centeredStateStyles}>
                <Text weight="semibold" size={400}>Đã xảy ra lỗi</Text>
                <Text size={300} style={{ color: tokens.colorPaletteDarkOrangeForeground1 }}>
                    {errorMessage}
                </Text>
            </div>
        )
    }

    if (isLoading && !article) {
        return (
            <div style={centeredStateStyles}>
                <Spinner size="large" label="Đang tải bài báo..." />
            </div>
        )
    }

    if (!article) {
        return (
            <div style={centeredStateStyles}>
                <Text weight="semibold" size={400}>Không tìm thấy bài báo</Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                    Bài báo có thể đã bị xóa hoặc bạn không có quyền truy cập.
                </Text>
            </div>
        )
    }

    // Handle clicking on TOC item
    // Handle clicking on TOC item
    const handleTocClick = (pageNumber: number) => {
        setJumpToPage(pageNumber)
        setTimeout(() => setJumpToPage(null), 100)
        // Auto-close TOC on mobile after clicking
        if (window.innerWidth <= 1024) {
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
            showError('Vui lòng chọn ít nhất một phản biện viên')
            return
        }
        
        if (reviewerEntryMode === 'manual') {
            if (!manualReviewerName.trim() || !manualReviewerEmail.trim() || !manualReviewerInstitutionId) {
                showError('Vui lòng điền đầy đủ thông tin phản biện viên')
                return
            }
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(manualReviewerEmail.trim())) {
                showError('Email không hợp lệ')
                return
            }
        }
        
        const note = acceptReason.trim() || 'Chấp nhận và gửi tới reviewer'
        
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
                    success('Đã phê duyệt và mời phản biện viên thành công')
                    setIsAcceptDialogOpen(false)
                    setAcceptReason('')
                    setSelectedReviewers([])
                    setManualReviewerName('')
                    setManualReviewerEmail('')
                    setManualReviewerInstitutionId('')
                    navigate(`/articles/${articleId}`)
                } catch (err) {
                    showError('Lỗi khi mời phản biện viên: ' + (err as Error).message)
                } finally {
                    setIsAssigningReviewers(false)
                }
            },
        })
    }

    const authorNames = article.authors?.map(author => author.name).join(', ') || 'Chưa cập nhật'
    const trackName = article.track?.name ?? 'Chưa gán'
    const submittedDate = formatDate(article.createdAt)
    const statusLabel = statusLabels[article.status] ?? article.status

    return (
        <div className={classes.root}>
            {/* Overlay for mobile when TOC is visible */}
            {isTocVisible && (
                <div className={classes.overlay} onClick={handleOverlayClick} />
            )}

            {/* Table of Contents Section */}
            <div className={`${classes.tocSection} ${
                !isTocVisible ? classes.tocSectionHidden : ''
            }`}>
                {/* Article Info */}
                <div className={classes.articleInfo}>
                    <div className={classes.infoCol}>
                        <Text size={200} className={classes.infoLabel}>
                            Tên bài báo
                        </Text>
                        <Text weight="semibold" size={300} style={{ display: 'block' }}>
                            {article.title}
                        </Text>
                    </div>
                    <div className={classes.infoCol}>
                        <Text size={200} className={classes.infoLabel}>
                            Tác giả:
                        </Text>
                        <Text size={200}>
                            {authorNames}
                        </Text>
                    </div>
                    <div className={classes.infoCol}>
                        <Text size={200} className={classes.infoLabel}>
                            Ngày gửi
                        </Text>
                        <Text size={200}>
                            {submittedDate}
                        </Text>
                    </div>
                    <div className={classes.infoCol}>
                        <Text size={200} className={classes.infoLabel}>
                            Chuyên đề
                        </Text>
                        <Text size={200}>{trackName}</Text>
                    </div>
                    <div className={classes.infoCol}>
                        <Text size={200} className={classes.infoLabel}>
                            Trạng thái hiện tại
                        </Text>
                        <Text size={200}>
                            {statusLabel}
                        </Text>
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
                    />
                </div>
            </div>

            {/* PDF Viewer Section */}
            <div className={classes.viewerSection}>
                {/* Header with Decision Buttons */}
                <div className={classes.viewerHeader}>
                    <Button
                        className={classes.tocToggleButtonDesktop}
                        appearance="subtle"
                        icon={isTocVisible ? <PanelLeftContractRegular /> : <PanelLeftExpandRegular />}
                        onClick={() => setIsTocVisible(!isTocVisible)}
                    >
                        {isTocVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
                    </Button>
                    <Dialog open={isRejectDialogOpen} onOpenChange={(_, data) => setIsRejectDialogOpen(data.open)}>
                        <DialogTrigger disableButtonEnhancement>
                            <Button
                                appearance="subtle"
                                icon={<DismissCircleRegular />}
                                style={{ color: tokens.colorPaletteRedForeground1 }}
                            >
                                Từ chối
                            </Button>
                        </DialogTrigger>
                        <DialogSurface>
                            <DialogBody>
                                <DialogTitle>Từ chối bài báo</DialogTitle>
                                <DialogContent>
                                    <Text size={300} style={{ display: 'block', marginBottom: '12px' }}>
                                        Lý do từ chối <span style={{ color: tokens.colorPaletteRedForeground1 }}>*</span>
                                    </Text>
                                    <Text size={200} style={{ display: 'block', marginBottom: '8px', color: tokens.colorNeutralForeground3 }}>
                                        Lý do từ chối sẽ được gửi kèm vào email phản hồi tác giả bài báo
                                    </Text>
                                    <Textarea
                                        placeholder="Nhập lý do từ chối tại đây"
                                        value={rejectReason}
                                        onChange={(_, data) => setRejectReason(data.value)}
                                        rows={6}
                                        resize="vertical"
                                    />
                                </DialogContent>
                                <DialogActions>
                                    <Button appearance="primary" onClick={handleReject} disabled={!rejectReason.trim() || isSubmittingDecision}>
                                        Từ chối bài báo
                                    </Button>
                                    <Button appearance="secondary" onClick={() => setIsRejectDialogOpen(false)}>
                                        Không, quay lại bước trước
                                    </Button>
                                </DialogActions>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>

                    <Dialog open={isAcceptDialogOpen} onOpenChange={(_, data) => setIsAcceptDialogOpen(data.open)}>
                            <DialogTrigger disableButtonEnhancement>
                                <Button
                                    appearance="primary"
                                    icon={<CheckmarkCircleRegular />}
                                    disabled={isSubmittingDecision}
                                >
                                    Chấp nhận và mời reviewer
                                </Button>
                            </DialogTrigger>
                            <DialogSurface>
                                <DialogBody>
                                    <DialogTitle>Chấp nhận và tìm Reviewer</DialogTitle>
                                    <DialogContent>
                                        <Text size={300} style={{ display: 'block', marginBottom: '12px' }}>
                                            Bạn đồng ý chấp nhận bài báo này và tìm reviewer phản biện bài báo?
                                        </Text>
                                        
                                        <Field label="Phương thức mời phản biện viên" style={{ marginBottom: '16px' }}>
                                            <RadioGroup
                                                value={reviewerEntryMode}
                                                onChange={(_, data) => setReviewerEntryMode(data.value as 'existing' | 'manual')}
                                            >
                                                <Radio value="existing" label="Chọn từ danh sách người dùng hiện có" />
                                                <Radio value="manual" label="Nhập thông tin phản biện viên mới" />
                                            </RadioGroup>
                                        </Field>
                                        
                                        {reviewerEntryMode === 'existing' ? (
                                            <Field
                                                label="Chọn phản biện viên"
                                                required
                                                style={{ marginBottom: '12px' }}
                                            >
                                                <Combobox
                                                    multiselect
                                                    placeholder="Chọn phản biện viên"
                                                    selectedOptions={selectedReviewers}
                                                    onOptionSelect={(_, data) => {
                                                        setSelectedReviewers(data.selectedOptions)
                                                    }}
                                                >
                                                    {reviewerUsers.map((user) => (
                                                        <Option key={user.id} value={user.id} text={`${user.name} (${user.email})`}>
                                                            {user.name} ({user.email})
                                                            {user.institution?.name && ` - ${user.institution.name}`}
                                                        </Option>
                                                    ))}
                                                </Combobox>
                                            </Field>
                                        ) : (
                                            <>
                                                <Field label="Họ và tên" required style={{ marginBottom: '12px' }}>
                                                    <Input
                                                        placeholder="Nhập họ và tên phản biện viên"
                                                        value={manualReviewerName}
                                                        onChange={(_, data) => setManualReviewerName(data.value)}
                                                    />
                                                </Field>
                                                
                                                <Field label="Email" required style={{ marginBottom: '12px' }}>
                                                    <Input
                                                        type="email"
                                                        placeholder="Nhập email phản biện viên"
                                                        value={manualReviewerEmail}
                                                        onChange={(_, data) => setManualReviewerEmail(data.value)}
                                                    />
                                                </Field>
                                                
                                                <Field label="Cơ quan" required style={{ marginBottom: '12px' }}>
                                                    <Combobox
                                                        placeholder="Chọn cơ quan"
                                                        value={institutions.find(i => i.id === manualReviewerInstitutionId)?.name || ''}
                                                        onOptionSelect={(_, data) => {
                                                            setManualReviewerInstitutionId(data.optionValue || '')
                                                        }}
                                                    >
                                                        {institutions.map((institution) => (
                                                            <Option key={institution.id} value={institution.id} text={institution.name}>
                                                                {institution.name}
                                                            </Option>
                                                        ))}
                                                    </Combobox>
                                                </Field>
                                            </>
                                        )}
                                        
                                        <Text size={200} style={{ display: 'block', marginBottom: '8px', color: tokens.colorNeutralForeground3 }}>
                                            Ghi chú (không bắt buộc):
                                        </Text>
                                        <Textarea
                                            placeholder="Nhập ghi chú nếu cần"
                                            value={acceptReason}
                                            onChange={(_, data) => setAcceptReason(data.value)}
                                            rows={4}
                                            resize="vertical"
                                        />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button 
                                            appearance="primary" 
                                            onClick={handleAccept} 
                                            disabled={
                                                isSubmittingDecision || 
                                                isAssigningReviewers || 
                                                (reviewerEntryMode === 'existing' && selectedReviewers.length === 0) ||
                                                (reviewerEntryMode === 'manual' && (!manualReviewerName.trim() || !manualReviewerEmail.trim() || !manualReviewerInstitutionId))
                                            }
                                        >
                                            {isAssigningReviewers ? 'Đang mời phản biện viên...' : 'Xác nhận'}
                                        </Button>
                                        <Button appearance="secondary" onClick={() => setIsAcceptDialogOpen(false)}>
                                            Không, quay lại bước trước
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
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
                    emptyMessage="Không có bài báo để xem"
                    onDocumentLoadSuccess={handleDocumentLoadSuccess}
                    jumpToPage={jumpToPage}
                />
            </div>

            {/* Floating Button for Mobile */}
            <Button
                className={classes.tocToggleButton}
                appearance="primary"
                shape="circular"
                size="large"
                icon={<NavigationRegular />}
                onClick={() => setIsTocVisible(!isTocVisible)}
                title={isTocVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
            />
        </div>
    )
}

export default EditorInitialReview
