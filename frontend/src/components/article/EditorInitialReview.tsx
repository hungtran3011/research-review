import { useState, useCallback, useRef } from 'react'
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
import { useParams } from 'react-router'
import { useArticle, useInitialReview } from '../../hooks/useArticles'
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

    // State management
    const [tocData, setTocData] = useState<TocItem[]>([])
    const [jumpToPage, setJumpToPage] = useState<number | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [acceptReason, setAcceptReason] = useState('')
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
    const [isTocVisible, setIsTocVisible] = useState<boolean>(true)

    const pdfDocumentRef = useRef<unknown>(null)
    const params = useParams<{ articleId: string }>()
    const articleId = params.articleId
    const safeArticleId = articleId ?? ''
    const { data: articleResponse, isLoading, isError, error } = useArticle(articleId, !!articleId)
    const article = articleResponse?.data
    const { mutate: submitInitialReview, isPending: isSubmittingDecision } = useInitialReview(safeArticleId)
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

    const handleAccept = () => {
        if (!articleId) return
        const note = acceptReason.trim() || 'Chấp nhận và gửi tới reviewer'
        submitInitialReview({
            decision: InitialReviewDecision.SEND_TO_REVIEW,
            note,
        }, {
            onSuccess: () => {
                setIsAcceptDialogOpen(false)
                setAcceptReason('')
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
                                        <Button appearance="primary" onClick={handleAccept} disabled={isSubmittingDecision}>
                                            Đồng ý và tiếp tục tìm người phản biện
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
                    fileUrl={article.link}
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
