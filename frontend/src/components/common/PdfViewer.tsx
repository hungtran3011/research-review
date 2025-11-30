import { Button, Text, makeStyles, SpinButton } from '@fluentui/react-components'
import { useCallback, useState, useRef, useEffect } from 'react'
import { ZoomIn20Regular, ZoomOut20Regular, DocumentRegular } from '@fluentui/react-icons'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const useStyles = makeStyles({
    pdfContainer: {
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--colorNeutralStroke1)',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'var(--colorNeutralBackground1)',
        height: '100%',
        width: '100%',
    },
    pdfControls: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--colorNeutralStroke1)',
        backgroundColor: 'var(--colorNeutralBackground2)',
    },
    pdfControlsLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    pdfControlsRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    pdfPageInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    pdfViewer: {
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        // backgroundColor: '#525659',
    },
    pdfPage: {
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
        marginBottom: '8px',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '16px',
        color: 'var(--colorNeutralForeground3)',
    },
})

interface PdfViewerProps {
    fileUrl: string | null
    emptyMessage?: string
    onDocumentLoadSuccess?: (pdf: unknown) => void
    jumpToPage?: number | null
    onPageChange?: (page: number) => void
}

export function PdfViewer({ 
    fileUrl, 
    emptyMessage = 'Chưa có tệp nào được tải lên', 
    onDocumentLoadSuccess,
    jumpToPage,
    onPageChange 
}: PdfViewerProps) {
    const classes = useStyles()
    
    // PDF viewer state
    const [numPages, setNumPages] = useState<number>(0)
    const [pdfWidth, setPdfWidth] = useState<number>(800)
    const [scale, setScale] = useState<number>(1.0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const pdfContainerRef = useRef<HTMLDivElement>(null)
    const pdfViewerRef = useRef<HTMLDivElement>(null)
    const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
    const isJumpingRef = useRef<boolean>(false)
    const lastJumpedPageRef = useRef<number>(1)
    const scrollTimeoutRef = useRef<number | null>(null)

    // PDF document loaded
    const onDocumentLoadSuccessInternal = useCallback(async (pdf: unknown) => {
        const pdfDoc = pdf as { numPages: number }
        setNumPages(pdfDoc.numPages)
        setCurrentPage(1)
        pageRefs.current = {}

        // Call parent callback if provided
        if (onDocumentLoadSuccess) {
            onDocumentLoadSuccess(pdf)
        }
    }, [onDocumentLoadSuccess])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [])

    // Calculate PDF width based on container and scale
    useEffect(() => {
        if (pdfContainerRef.current) {
            const containerWidth = pdfContainerRef.current.offsetWidth
            setPdfWidth((containerWidth - 64) * scale)
        }
    }, [scale])

    // Track current page as user scrolls
    useEffect(() => {
        const viewer = pdfViewerRef.current
        if (!viewer || numPages === 0) return

        let scrollDebounceTimeout: number | null = null

        const handleScroll = () => {
            // Don't update page during programmatic jumps
            if (isJumpingRef.current) return

            // Debounce the scroll event to avoid rapid updates
            if (scrollDebounceTimeout) {
                clearTimeout(scrollDebounceTimeout)
            }

            scrollDebounceTimeout = window.setTimeout(() => {
                const viewerRect = viewer.getBoundingClientRect()
                const viewerCenter = viewerRect.top + viewerRect.height / 2

                let closestPage = 1
                let closestDistance = Infinity

                for (let i = 1; i <= numPages; i++) {
                    const pageElement = pageRefs.current[i]
                    if (pageElement) {
                        const pageRect = pageElement.getBoundingClientRect()
                        const pageCenter = pageRect.top + pageRect.height / 2
                        const distance = Math.abs(pageCenter - viewerCenter)

                        if (distance < closestDistance) {
                            closestDistance = distance
                            closestPage = i
                        }
                    }
                }

                // Only update if the page actually changed
                if (closestPage !== currentPage) {
                    lastJumpedPageRef.current = closestPage
                    setCurrentPage(closestPage)
                }
            }, 150)
        }

        viewer.addEventListener('scroll', handleScroll)
        return () => {
            viewer.removeEventListener('scroll', handleScroll)
            if (scrollDebounceTimeout) {
                clearTimeout(scrollDebounceTimeout)
            }
        }
    }, [numPages, currentPage])

    // Handle jump to page from parent component
    useEffect(() => {
        if (jumpToPage && jumpToPage >= 1 && jumpToPage <= numPages) {
            const pageElement = pageRefs.current[jumpToPage]
            if (pageElement) {
                isJumpingRef.current = true
                lastJumpedPageRef.current = jumpToPage
                setCurrentPage(jumpToPage)
                
                pageElement.scrollIntoView({ behavior: 'instant', block: 'center' })
                
                setTimeout(() => {
                    isJumpingRef.current = false
                }, 100)
            }
        }
    }, [jumpToPage, numPages])

    // Notify parent of page changes
    useEffect(() => {
        if (onPageChange) {
            onPageChange(currentPage)
        }
    }, [currentPage, onPageChange])

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setScale((prev) => Math.min(prev + 0.25, 3.0))
    }, [])

    const handleZoomOut = useCallback(() => {
        setScale((prev) => Math.max(prev - 0.25, 0.5))
    }, [])

    const handleResetZoom = useCallback(() => {
        setScale(1.0)
    }, [])

    return (
        <div className={classes.pdfContainer} ref={pdfContainerRef}>
            {fileUrl ? (
                <>
                    <div className={classes.pdfControls}>
                        <div className={classes.pdfControlsLeft}>
                            <div className={classes.pdfPageInfo}>
                                <Text>Trang</Text>
                                <SpinButton
                                    value={currentPage}
                                    displayValue={currentPage.toString()}
                                    min={1}
                                    max={numPages}
                                    step={1}
                                    onChange={(_, data) => {
                                        // Clear any pending scroll timeout
                                        if (scrollTimeoutRef.current) {
                                            clearTimeout(scrollTimeoutRef.current)
                                        }
                                        
                                        // Only process if we have a valid value
                                        let pageNum: number | null = null
                                        
                                        if (data.value !== undefined && data.value !== null) {
                                            pageNum = data.value
                                        } else if (data.displayValue !== undefined && data.displayValue !== '') {
                                            const parsed = parseInt(data.displayValue, 10)
                                            if (!isNaN(parsed)) {
                                                pageNum = parsed
                                            }
                                        }
                                        
                                        if (pageNum !== null && pageNum >= 1 && pageNum <= numPages && pageNum !== currentPage) {
                                            // Immediately update refs to prevent race conditions
                                            isJumpingRef.current = true
                                            lastJumpedPageRef.current = pageNum
                                            
                                            // Update state
                                            setCurrentPage(pageNum)
                                            
                                            // Use requestAnimationFrame to ensure the page elements are rendered
                                            requestAnimationFrame(() => {
                                                const pageElement = pageRefs.current[pageNum!]
                                                const viewer = pdfViewerRef.current
                                                
                                                if (pageElement && viewer) {
                                                    pageElement.scrollIntoView({ behavior: 'instant', block: 'start' })
                                                }
                                                
                                                scrollTimeoutRef.current = window.setTimeout(() => {
                                                    isJumpingRef.current = false
                                                    scrollTimeoutRef.current = null
                                                }, 300)
                                            })
                                        }
                                    }}
                                    style={{ width: '80px' }}
                                />
                                <Text>/ {numPages}</Text>
                            </div>
                        </div>
                        <div className={classes.pdfControlsRight}>
                            <Button
                                appearance="subtle"
                                icon={<ZoomOut20Regular />}
                                onClick={handleZoomOut}
                                disabled={scale <= 0.5}
                            />
                            <Text size={300}>{Math.round(scale * 100)}%</Text>
                            <Button
                                appearance="subtle"
                                icon={<ZoomIn20Regular />}
                                onClick={handleZoomIn}
                                disabled={scale >= 3.0}
                            />
                            <Button
                                appearance="subtle"
                                size="small"
                                onClick={handleResetZoom}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                    <div className={classes.pdfViewer} ref={pdfViewerRef}>
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccessInternal}
                            loading={<Text>Đang tải PDF...</Text>}
                            error={<Text>Lỗi khi tải PDF</Text>}
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <div
                                    key={`page_${index + 1}`}
                                    ref={(el) => { pageRefs.current[index + 1] = el }}
                                >
                                    <Page
                                        pageNumber={index + 1}
                                        className={classes.pdfPage}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        width={pdfWidth}
                                    />
                                </div>
                            ))}
                        </Document>
                    </div>
                </>
            ) : (
                <>
                    <div className={classes.pdfControls}>
                        <div className={classes.pdfControlsLeft}>
                            <Text>Không có tài liệu</Text>
                        </div>
                        <div className={classes.pdfControlsRight}>
                            <Button
                                appearance="subtle"
                                icon={<ZoomOut20Regular />}
                                disabled
                            />
                            <Text size={300}>100%</Text>
                            <Button
                                appearance="subtle"
                                icon={<ZoomIn20Regular />}
                                disabled
                            />
                            <Button
                                appearance="subtle"
                                size="small"
                                disabled
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                    <div className={classes.pdfViewer}>
                        <div className={classes.emptyState}>
                            <DocumentRegular style={{ fontSize: '48px' }} />
                            <Text size={400}>{emptyMessage}</Text>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
