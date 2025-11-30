import { useState, useCallback, useRef, useEffect } from 'react'
import {
    makeStyles,
    Button,
    Text,
    Textarea,
    Card,
    Badge,
    Dropdown,
    Option,
    tokens,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
} from '@fluentui/react-components'
import {
    CommentRegular,
    DismissRegular,
    CheckmarkRegular,
    PanelRightContractRegular,
    PanelRightExpandRegular,
    NavigationRegular,
} from '@fluentui/react-icons'
import { PdfViewer, TableOfContents } from '../common'
import type { TocItem } from '../common'
import type { CommentDto, ArticleVersionDto } from '../../models'

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
    tocWrapper: {
        width: '280px',
        flexShrink: 0,
        height: '100%',
        position: 'relative',
        zIndex: 100,
        transition: 'transform 0.3s ease-in-out',
        '@media (max-width: 1024px)': {
            position: 'fixed',
            left: 0,
            top: '64px',
            height: 'calc(100vh - 64px)',
            boxShadow: tokens.shadow16,
            zIndex: 1002,
        },
    },
    tocWrapperHidden: {
        '@media (max-width: 1024px)': {
            transform: 'translateX(-100%)',
        },
        '@media (min-width: 1025px)': {
            transform: 'translateX(-100%)',
        },
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
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
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
            display: 'none', // Hide on mobile, use modal instead
        },
    },
    commentsSectionCollapsed: {
        '@media (max-width: 1024px)': {
            transform: 'translateY(calc(100% - 56px))',
        },
    },
    commentsSectionHidden: {
        '@media (min-width: 1025px)': {
            transform: 'translateX(100%)',
        },
        '@media (max-width: 1024px)': {
            transform: 'translateY(100%)',
        },
    },
    commentsDialogSurface: {
        maxWidth: '90vw',
        width: '500px',
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
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
    },
    commentsList: {
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: 0,
    },
    commentCard: {
        padding: '12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        ':hover': {
            boxShadow: tokens.shadow8,
        },
        flexShrink: 0,
    },
    commentCardSelected: {
        boxShadow: tokens.shadow16,
    },
    commentHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
    },
    commentMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    commentContent: {
        marginTop: '8px',
        padding: '8px',
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: '4px',
    },
    commentActions: {
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
    },
    newCommentForm: {
        padding: '16px',
        borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
        '@media (max-width: 1024px)': {
            minHeight: '200px',
        },
    },
    annotationMarker: {
        position: 'absolute',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: tokens.colorPaletteYellowBackground2,
        border: `2px solid ${tokens.colorPaletteYellowBorder2}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        boxShadow: tokens.shadow4,
        zIndex: 1000,
        transition: 'transform 0.2s',
        ':hover': {
            transform: 'scale(1.2)',
            boxShadow: tokens.shadow8,
        },
    },
    highlightOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 0, 0.3)',
        pointerEvents: 'none',
        zIndex: 999,
    },
    floatingButton: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1001,
        boxShadow: tokens.shadow16,
        '@media (min-width: 1025px)': {
            display: 'none',
        },
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
    commentsToggleButton: {
        '@media (min-width: 1025px)': {
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

// Data Types
interface ReviewArticleProps {
    articleId?: string
    // This would come from API/props
    initialVersions?: ArticleVersionDto[]
    initialComments?: CommentDto[]
}

function ReviewArticle({ initialVersions = [], initialComments = [] }: ReviewArticleProps) {
    const classes = useStyles()

    // State management
    const [versions] = useState<ArticleVersionDto[]>(initialVersions)
    const [currentVersion, setCurrentVersion] = useState<number>(versions[versions.length - 1]?.version || 1)
    const [pdfUrl, setPdfUrl] = useState<string | null>(versions[versions.length - 1]?.fileUrl || null)
    const [tocData, setTocData] = useState<TocItem[]>([])
    const [comments, setComments] = useState<CommentDto[]>(initialComments)
    const [selectedComment, setSelectedComment] = useState<CommentDto | null>(null)
    const [newCommentText, setNewCommentText] = useState('')
    const [isAddingComment, setIsAddingComment] = useState(false)
    const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null)
    const [selectedText, setSelectedText] = useState<string>('')
    const [jumpToPage, setJumpToPage] = useState<number | null>(null)
    const [currentPdfPage, setCurrentPdfPage] = useState<number>(1)
    const [isTocVisible, setIsTocVisible] = useState<boolean>(true)
    const [isCommentsVisible, setIsCommentsVisible] = useState<boolean>(true)
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 1024)

    const pdfDocumentRef = useRef<unknown>(null)

    // Track mobile/desktop view
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024)
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
        if (versionData) {
            setPdfUrl(versionData.fileUrl)
        }
    }

    // Filter comments - show all comments from this version and earlier versions
    // This allows reviewers to see previous comments and mark them as resolved when viewing newer versions
    // Sort by version (descending) so most recent comments appear first
    const versionComments = comments
        .filter(c => c.version <= currentVersion)
        .sort((a, b) => b.version - a.version || b.createdAt.getTime() - a.createdAt.getTime())

    // Handle adding new comment
    const handleAddComment = () => {
        if (!newCommentText.trim()) return

        const newComment: CommentDto = {
            id: Date.now().toString(),
            version: currentVersion,
            pageNumber: currentPdfPage, // Use actual current page from PDF viewer
            position: selectedPosition ? { x: selectedPosition.x, y: selectedPosition.y } : undefined,
            selectedText: selectedText || undefined,
            content: newCommentText,
            author: 'Current Reviewer', // This should come from auth context
            authorId: 'reviewer-1',
            createdAt: new Date(),
            status: 'open',
            section: getSectionForPage(currentPdfPage),
        }

        setComments(prev => [...prev, newComment])
        setNewCommentText('')
        setIsAddingComment(false)
        setSelectedPosition(null)
        setSelectedText('')
    }

    // Handle comment status change
    const handleCommentStatusChange = (commentId: string, status: CommentDto['status']) => {
        setComments(prev =>
            prev.map(c => (c.id === commentId ? { ...c, status } : c))
        )
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
    const getStatusBadge = (status: CommentDto['status']) => {
        const config = {
            open: { color: 'warning' as const, text: 'Mở' },
            resolved: { color: 'success' as const, text: 'Đã giải quyết' },
            addressed: { color: 'informative' as const, text: 'Đã xử lý' },
        }
        const { color, text } = config[status]
        return <Badge appearance="filled" color={color}>{text}</Badge>
    }

    // Handle overlay click to close TOC on mobile
    const handleOverlayClick = () => {
        if (isTocVisible) {
            setIsTocVisible(false)
        }
    }

    // Render comments content (reusable for both desktop and mobile)
    const renderCommentsContent = () => (
        <>
            <div className={classes.commentsHeader}>
                <Text weight="semibold" size={400}>
                    Nhận xét ({versionComments.length})
                </Text>
                <Dropdown
                    placeholder="Chọn phiên bản"
                    value={`Phiên bản ${currentVersion}`}
                    onOptionSelect={(_, data) => {
                        if (data.optionValue) {
                            handleVersionChange(Number(data.optionValue))
                        }
                    }}
                >
                    {versions.map(v => (
                        <Option key={v.version} value={v.version.toString()} text={`Phiên bản ${v.version}`}>
                            Phiên bản {v.version} - {new Date(v.uploadedAt).toLocaleDateString('vi-VN')}
                        </Option>
                    ))}
                </Dropdown>
            </div>

            <div className={classes.commentsList}>
                {versionComments.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                        Không có nhận xét cho phiên bản này
                    </Text>
                ) : (
                    versionComments.map(comment => (
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
                                        {comment.author}
                                    </Text>
                                    <Badge
                                        appearance="outline"
                                        color={comment.version === currentVersion ? "brand" : "informative"}
                                        size="small"
                                        style={{ marginLeft: '8px' }}
                                    >
                                        {comment.version === currentVersion ? `hiện tại - v${comment.version}` : `v${comment.version}`}
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
                                    Trang {comment.pageNumber}
                                </Text>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    •
                                </Text>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    {new Date(comment.createdAt).toLocaleString()}
                                </Text>
                            </div>

                            {comment.selectedText && (
                                <div style={{
                                    padding: '8px',
                                    backgroundColor: tokens.colorNeutralBackground3,
                                    borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}`,
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontStyle: 'italic',
                                }}>
                                    "{comment.selectedText}"
                                </div>
                            )}

                            <div className={classes.commentContent}>
                                <Text size={300}>{comment.content}</Text>
                            </div>

                            <div className={classes.commentActions}>
                                <Button
                                    size="small"
                                    appearance="subtle"
                                    icon={<CheckmarkRegular />}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleCommentStatusChange(comment.id, 'resolved')
                                    }}
                                >
                                    Giải quyết
                                </Button>
                                <Button
                                    size="small"
                                    appearance="subtle"
                                    icon={<DismissRegular />}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setComments(prev => prev.filter(c => c.id !== comment.id))
                                    }}
                                >
                                    Xóa
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {isAddingComment && (
                <div className={classes.newCommentForm}>
                    <Text weight="semibold" size={300}>Nhận xét mới</Text>
                    
                    {selectedText && (
                        <div style={{
                            padding: '8px',
                            backgroundColor: tokens.colorNeutralBackground3,
                            borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}`,
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontStyle: 'italic',
                        }}>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                Văn bản được chọn:
                            </Text>
                            <Text size={300} style={{ display: 'block', marginTop: '4px' }}>
                                "{selectedText}"
                            </Text>
                        </div>
                    )}
                    
                    <div style={{
                        padding: '8px',
                        backgroundColor: tokens.colorNeutralBackground2,
                        borderRadius: '4px',
                        marginBottom: '8px',
                    }}>
                        {getSectionForPage(currentPdfPage) && (
                            <Text size={200} style={{ display: 'block', marginBottom: '4px' }}>
                                Phần: <strong>{getSectionForPage(currentPdfPage)}</strong>
                            </Text>
                        )}
                        <Text size={200}>
                            Trang: <strong>{currentPdfPage}</strong>
                        </Text>
                    </div>
                    
                    <Textarea
                        placeholder="Viết nhận xét của bạn..."
                        value={newCommentText}
                        onChange={(_, data) => setNewCommentText(data.value)}
                        rows={4}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button appearance="primary" onClick={handleAddComment}>
                            Đăng nhận xét
                        </Button>
                        <Button
                            appearance="subtle"
                            onClick={() => {
                                setIsAddingComment(false)
                                setNewCommentText('')
                                setSelectedText('')
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            )}
        </>
    )

    return (
        <div className={classes.root}>
            {/* Overlay for mobile when TOC is visible */}
            {isTocVisible && (
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
                        Phản biện bài báo
                    </Text>
                    <Button
                        appearance="primary"
                        icon={<CommentRegular />}
                        onClick={() => {
                            setIsAddingComment(true)
                            setIsCommentsVisible(true)
                        }}
                    >
                        Thêm nhận xét
                    </Button>
                    <Button
                        className={classes.commentsToggleButton}
                        appearance="subtle"
                        icon={isCommentsVisible ? <PanelRightContractRegular /> : <PanelRightExpandRegular />}
                        onClick={() => setIsCommentsVisible(!isCommentsVisible)}
                    >
                        {isCommentsVisible ? 'Ẩn nhận xét' : 'Hiện nhận xét'}
                    </Button>
                </div>
                <PdfViewer
                    fileUrl={pdfUrl}
                    emptyMessage="Không có bài báo để phản biện"
                    onDocumentLoadSuccess={handleDocumentLoadSuccess}
                    jumpToPage={jumpToPage}
                    onPageChange={setCurrentPdfPage}
                />
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
                                        Nhận xét
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
            <Button
                className={classes.tocToggleButton}
                appearance="primary"
                shape="circular"
                size="large"
                icon={<NavigationRegular />}
                onClick={() => setIsTocVisible(!isTocVisible)}
                title={isTocVisible ? 'Ẩn mục lục' : 'Hiện mục lục'}
            />

            <Button
                className={classes.floatingButton}
                appearance="primary"
                shape="circular"
                size="large"
                icon={<CommentRegular />}
                onClick={() => setIsCommentsVisible(!isCommentsVisible)}
                title={isCommentsVisible ? 'Ẩn nhận xét' : 'Hiện nhận xét'}
            />
        </div>
    )
}

export default ReviewArticle
