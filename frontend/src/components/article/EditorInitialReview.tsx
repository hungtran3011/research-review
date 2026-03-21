import { useState, useCallback, useRef, useMemo } from 'react'
import { Button, Typography, Input, Modal, Radio, Select, Spin, Form } from 'antd'
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
import { useBasicToast } from '../../hooks/useBasicToast'
import { InitialReviewDecision, ArticleStatus } from '../../constants'

const { Text } = Typography

const styles = {
    root: {
        display: 'flex',
        height: 'calc(100vh - 64px)',
        width: '100%',
        overflow: 'hidden',
        flexDirection: 'row' as const,
        position: 'relative' as const,
    },
    tocSection: {
        width: '280px',
        flexShrink: 0,
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 100,
    },
    tocSectionHidden: {
        transform: 'translateX(-100%)',
    },
    articleInfo: {
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#ffffff',
        flexShrink: 0,
    },
    infoCol: {
        marginBottom: '8px',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    infoLabel: {
        color: '#8c8c8c',
        marginBottom: '4px',
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
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa',
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 999,
    },
} as const

function EditorInitialReview() {
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
        flexDirection: 'column' as const,
        gap: '12px',
        padding: '24px',
        textAlign: 'center' as const,
    }

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
                <Text strong style={{ fontSize: '18px' }}>Không tìm thấy bài báo</Text>
                <Text style={{ color: '#8c8c8c' }}>
                    Đường dẫn không hợp lệ.
                </Text>
            </div>
        )
    }

    if (isError) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin bài báo.'
        return (
            <div style={centeredStateStyles}>
                <Text strong style={{ fontSize: '18px' }}>Đã xảy ra lỗi</Text>
                <Text style={{ color: '#ff4d4f' }}>
                    {errorMessage}
                </Text>
            </div>
        )
    }

    if (isLoading && !article) {
        return (
            <div style={centeredStateStyles}>
                <Spin size="large" tip="Đang tải bài báo..." />
            </div>
        )
    }

    if (!article) {
        return (
            <div style={centeredStateStyles}>
                <Text strong style={{ fontSize: '18px' }}>Không tìm thấy bài báo</Text>
                <Text style={{ color: '#8c8c8c' }}>
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
        <div style={styles.root}>
            {/* Overlay for mobile when TOC is visible */}
            {isTocVisible && (
                <div style={styles.overlay} onClick={handleOverlayClick} />
            )}

            {/* Table of Contents Section */}
            <div style={!isTocVisible ? { ...styles.tocSection, ...styles.tocSectionHidden } : styles.tocSection}>
                {/* Article Info */}
                <div style={styles.articleInfo}>
                    <div style={styles.infoCol}>
                        <Text style={styles.infoLabel}>
                            Tên bài báo
                        </Text>
                        <Text strong style={{ display: 'block' }}>
                            {article.title}
                        </Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text style={styles.infoLabel}>
                            Tác giả:
                        </Text>
                        <Text>
                            {authorNames}
                        </Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text style={styles.infoLabel}>
                            Ngày gửi
                        </Text>
                        <Text>
                            {submittedDate}
                        </Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text style={styles.infoLabel}>
                            Chuyên đề
                        </Text>
                        <Text>{trackName}</Text>
                    </div>
                    <div style={styles.infoCol}>
                        <Text style={styles.infoLabel}>
                            Trạng thái hiện tại
                        </Text>
                        <Text>
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
            <div style={styles.viewerSection}>
                {/* Header with Decision Buttons */}
                <div style={styles.viewerHeader}>
                    <Button
                        type="text"
                        icon={isTocVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                        onClick={() => setIsTocVisible(!isTocVisible)}
                    >
                        {isTocVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
                    </Button>
                    <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        style={{ color: '#ff4d4f' }}
                        onClick={() => setIsRejectDialogOpen(true)}
                    >
                        Từ chối
                    </Button>

                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        disabled={isSubmittingDecision}
                        onClick={() => setIsAcceptDialogOpen(true)}
                    >
                        Chấp nhận và mời reviewer
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
                    emptyMessage="Không có bài báo để xem"
                    onDocumentLoadSuccess={handleDocumentLoadSuccess}
                    jumpToPage={jumpToPage}
                />
            </div>

            {/* Floating Button for Mobile */}
            <Button
                style={styles.tocToggleButton}
                type="primary"
                shape="circle"
                size="large"
                icon={<MenuOutlined />}
                onClick={() => setIsTocVisible(!isTocVisible)}
                title={isTocVisible ? 'Ẩn thông tin' : 'Hiện thông tin'}
            />

            {/* Reject Dialog */}
            <Modal
                title="Từ chối bài báo"
                open={isRejectDialogOpen}
                onCancel={() => setIsRejectDialogOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsRejectDialogOpen(false)}>
                        Không, quay lại bước trước
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleReject}
                        disabled={!rejectReason.trim()}
                        loading={isSubmittingDecision}
                    >
                        Từ chối bài báo
                    </Button>,
                ]}
            >
                <div style={{ marginBottom: '12px' }}>
                    <Text style={{ display: 'block', marginBottom: '12px' }}>
                        Lý do từ chối <span style={{ color: '#ff4d4f' }}>*</span>
                    </Text>
                    <Text style={{ display: 'block', marginBottom: '8px', color: '#8c8c8c', fontSize: '12px' }}>
                        Lý do từ chối sẽ được gửi kèm vào email phản hồi tác giả bài báo
                    </Text>
                    <Input.TextArea
                        placeholder="Nhập lý do từ chối tại đây"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={6}
                    />
                </div>
            </Modal>

            {/* Accept Dialog */}
            <Modal
                title="Chấp nhận và tìm Reviewer"
                open={isAcceptDialogOpen}
                onCancel={() => setIsAcceptDialogOpen(false)}
                width={600}
                footer={[
                    <Button key="cancel" onClick={() => setIsAcceptDialogOpen(false)}>
                        Không, quay lại bước trước
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
                        Xác nhận
                    </Button>,
                ]}
            >
                <Text style={{ display: 'block', marginBottom: '12px' }}>
                    Bạn đồng ý chấp nhận bài báo này và tìm reviewer phản biện bài báo?
                </Text>
                
                <Form.Item label="Phương thức mời phản biện viên" style={{ marginBottom: '16px' }}>
                    <Radio.Group
                        value={reviewerEntryMode}
                        onChange={(e) => setReviewerEntryMode(e.target.value as 'existing' | 'manual')}
                    >
                        <Radio value="existing">Chọn từ danh sách người dùng hiện có</Radio>
                        <Radio value="manual">Nhập thông tin phản biện viên mới</Radio>
                    </Radio.Group>
                </Form.Item>
                
                {reviewerEntryMode === 'existing' ? (
                    <Form.Item
                        label="Chọn phản biện viên"
                        required
                        style={{ marginBottom: '12px' }}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn phản biện viên"
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
                        <Form.Item label="Họ và tên" required style={{ marginBottom: '12px' }}>
                            <Input
                                placeholder="Nhập họ và tên phản biện viên"
                                value={manualReviewerName}
                                onChange={(e) => setManualReviewerName(e.target.value)}
                            />
                        </Form.Item>
                        
                        <Form.Item label="Email" required style={{ marginBottom: '12px' }}>
                            <Input
                                type="email"
                                placeholder="Nhập email phản biện viên"
                                value={manualReviewerEmail}
                                onChange={(e) => setManualReviewerEmail(e.target.value)}
                            />
                        </Form.Item>
                        
                        <Form.Item label="Cơ quan" required style={{ marginBottom: '12px' }}>
                            <Select
                                placeholder="Chọn cơ quan"
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
                
                <Text style={{ display: 'block', marginBottom: '8px', color: '#8c8c8c', fontSize: '12px' }}>
                    Ghi chú (không bắt buộc):
                </Text>
                <Input.TextArea
                    placeholder="Nhập ghi chú nếu cần"
                    value={acceptReason}
                    onChange={(e) => setAcceptReason(e.target.value)}
                    rows={4}
                />
            </Modal>
        </div>
    )
}

export default EditorInitialReview
