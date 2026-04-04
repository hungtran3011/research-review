import { Button, Typography, InputNumber, theme as antdTheme } from 'antd'
import { useCallback, useState, useRef, useEffect } from 'react'
import { ZoomInOutlined, ZoomOutOutlined, FileOutlined } from '@ant-design/icons'
import { Document, Page, pdfjs } from 'react-pdf'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

const { Text } = Typography

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
    fileUrl: string | null
    emptyMessage?: string
    onDocumentLoadSuccess?: (pdf: unknown) => void
    jumpToPage?: number | null
    onPageChange?: (page: number) => void
}

export function PdfViewer({ 
    fileUrl, 
    emptyMessage,
    onDocumentLoadSuccess,
    jumpToPage,
    onPageChange 
}: PdfViewerProps) {
    const { t } = useTranslation('common')
    const { token } = antdTheme.useToken()
    const accessToken = useAuthStore((s) => s.accessToken)
    const resolvedEmptyMessage = emptyMessage ?? t('pdfViewer.emptyMessage')

    const isBlobLikeUrl = !!fileUrl && (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:'))
    const isProxyUrl = (() => {
        if (!fileUrl) return false
        try {
            const url = new URL(fileUrl, window.location.origin)
            return url.pathname.includes('/api/v1/articles/') && url.pathname.endsWith('/pdf')
        } catch {
            // Fallback for odd/relative URLs: ignore query/hash when checking path
            const withoutQueryOrHash = fileUrl.split(/[?#]/)[0]
            return (
                withoutQueryOrHash.includes('/api/v1/articles/') &&
                withoutQueryOrHash.endsWith('/pdf')
            )
        }
    })()
    
    // State for blob URL (for proxy-fetched PDFs)
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [isBlobLoading, setIsBlobLoading] = useState<boolean>(false)

    // Reset any prior load error when switching documents.
    useEffect(() => {
        setLoadError(null)
    }, [fileUrl])

    // Fetch PDF as blob for proxy URLs
    useEffect(() => {
        if (!isProxyUrl || !fileUrl) return

        setBlobUrl(null)
        setIsBlobLoading(true)

        const fetchPdfBlob = async () => {
            try {
                const response = await fetch(fileUrl, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                    credentials: 'include',
                })
                if (!response.ok) {
                    console.error('PDF fetch failed:', response.status, response.statusText)
                    setIsBlobLoading(false)
                    setLoadError(`${t('pdfViewer.errors.fetchFailedPrefix')}${response.status}`)
                    return
                }

                const contentType = response.headers.get('content-type') || ''
                if (!contentType.toLowerCase().includes('pdf')) {
                    console.warn('Unexpected content type for PDF fetch:', contentType)
                    setIsBlobLoading(false)
                    setLoadError(t('pdfViewer.errors.invalidContentType'))
                    return
                }

                const blob = await response.blob()
                
                // Ensure blob has correct MIME type
                const typedBlob = new Blob([blob], { type: 'application/pdf' })
                const url = URL.createObjectURL(typedBlob)
                
                console.log('PDF blob loaded successfully:', url, 'size:', blob.size)
                setBlobUrl(url)
            } catch (err) {
                console.error('Failed to fetch PDF blob:', err)
                setLoadError(t('pdfViewer.errors.cannotLoadPdf'))
            } finally {
                setIsBlobLoading(false)
            }
        }

        fetchPdfBlob()

        // Cleanup blob URL on unmount or URL change
        return () => {
            setBlobUrl((prev) => {
                if (prev) {
                    URL.revokeObjectURL(prev)
                }
                return null
            })
        }
    }, [fileUrl, isProxyUrl, accessToken, t])
    
    // PDF viewer state
    const [numPages, setNumPages] = useState<number>(0)
    const [pdfWidth, setPdfWidth] = useState<number>(800)
    const [scale, setScale] = useState<number>(1.0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
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
        setLoadError(null)

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

    const handleDownload = useCallback(async () => {
        if (!fileUrl) return

        const triggerDownload = (href: string, fileName: string) => {
            const anchor = document.createElement('a')
            anchor.href = href
            anchor.download = fileName
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
        }

        const fallbackName = 'document.pdf'

        try {
            setIsDownloading(true)

            if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
                triggerDownload(fileUrl, fallbackName)
                return
            }

            const response = await fetch(fileUrl, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`${t('pdfViewer.errors.fetchFailedPrefix')}${response.status}`)
            }

            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            const urlObj = new URL(fileUrl, window.location.origin)
            const candidateName = decodeURIComponent(urlObj.pathname.split('/').pop() || '').trim()
            const finalName = candidateName && candidateName.includes('.') ? candidateName : fallbackName
            triggerDownload(objectUrl, finalName)
            URL.revokeObjectURL(objectUrl)
        } catch (error) {
            console.error('Failed to download PDF:', error)
        } finally {
            setIsDownloading(false)
        }
    }, [fileUrl, accessToken, t])

    return (
        <div ref={pdfContainerRef} style={{
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: '8px',
            overflow: 'hidden',
            height: '100%',
            width: '100%',
        }}>
            {fileUrl ? (
                <>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <Text>{t('pdfViewer.page')}</Text>
                                <InputNumber
                                    value={currentPage}
                                    min={1}
                                    max={numPages}
                                    step={1}
                                    disabled={!!loadError}
                                    onChange={(val) => {
                                        // Clear any pending scroll timeout
                                        if (scrollTimeoutRef.current) {
                                            clearTimeout(scrollTimeoutRef.current)
                                        }
                                        
                                        const pageNum = val as number
                                        if (pageNum >= 1 && pageNum <= numPages && pageNum !== currentPage) {
                                            // Immediately update refs to prevent race conditions
                                            isJumpingRef.current = true
                                            lastJumpedPageRef.current = pageNum
                                            
                                            // Update state
                                            setCurrentPage(pageNum)
                                            
                                            // Use requestAnimationFrame to ensure the page elements are rendered
                                            requestAnimationFrame(() => {
                                                const pageElement = pageRefs.current[pageNum]
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
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <Button
                                type="text"
                                size="small"
                                onClick={() => {
                                    void handleDownload()
                                }}
                                disabled={isDownloading}
                            >
                                {t('pdfViewer.download')}
                            </Button>
                            <Button
                                type="text"
                                size="small"
                                icon={<ZoomOutOutlined />}
                                onClick={handleZoomOut}
                                disabled={!!loadError || scale <= 0.5}
                            />
                            <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>{Math.round(scale * 100)}%</Text>
                            <Button
                                type="text"
                                size="small"
                                icon={<ZoomInOutlined />}
                                onClick={handleZoomIn}
                                disabled={!!loadError || scale >= 3.0}
                            />
                            <Button
                                type="text"
                                size="small"
                                onClick={handleResetZoom}
                                disabled={!!loadError}
                            >
                                {t('pdfViewer.reset')}
                            </Button>
                        </div>
                    </div>
                    <div ref={pdfViewerRef} style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                    }}>
                        {loadError ? (
                            <>
                                <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>
                                    {t('pdfViewer.errors.inlinePreviewFallback')}
                                </Text>
                                <div style={{ width: '100%', flex: 1, minHeight: '600px' }}>
                                    <iframe
                                        title="pdf-preview"
                                        src={fileUrl}
                                        style={{ width: '100%', height: '100%', border: 0 }}
                                    />
                                </div>
                            </>
                        ) : isProxyUrl && !blobUrl ? (
                            <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>
                                {isBlobLoading ? t('pdfViewer.loadingPdf') : t('pdfViewer.errors.cannotLoadFromServer') }
                            </Text>
                        ) : (
                            <Document
                                file={
                                    isProxyUrl && blobUrl
                                        ? blobUrl  // Use blob URL for proxy-fetched PDFs
                                        : isBlobLikeUrl
                                        ? fileUrl
                                        : { url: fileUrl }
                                }
                                options={
                                    isProxyUrl || isBlobLikeUrl
                                        ? undefined
                                        : {
                                              httpHeaders: accessToken
                                                  ? { Authorization: `Bearer ${accessToken}` }
                                                  : undefined,
                                              withCredentials: true,
                                          }
                                }
                                onLoadSuccess={onDocumentLoadSuccessInternal}
                                onLoadError={(err) => {
                                    const message = err instanceof Error ? err.message : String(err)
                                    setLoadError(message)
                                }}
                                loading={<Text>{t('pdfViewer.loadingPdf')}</Text>}
                                error={<Text>{t('pdfViewer.errors.loadError')}</Text>}
                            >
                                {Array.from(new Array(numPages), (_, index) => (
                                    <div
                                        key={`page_${index + 1}`}
                                        ref={(el) => { pageRefs.current[index + 1] = el }}
                                        style={{
                                            boxShadow: token.boxShadowSecondary,
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <Page
                                            pageNumber={index + 1}
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                            width={pdfWidth}
                                        />
                                    </div>
                                ))}
                            </Document>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <Text>{t('pdfViewer.noDocument')}</Text>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <Button
                                type="text"
                                size="small"
                                icon={<ZoomOutOutlined />}
                                disabled
                            />
                            <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>100%</Text>
                            <Button
                                type="text"
                                size="small"
                                icon={<ZoomInOutlined />}
                                disabled
                            />
                            <Button
                                type="text"
                                size="small"
                                disabled
                            >
                                {t('pdfViewer.reset')}
                            </Button>
                        </div>
                    </div>
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: '16px',
                            color: token.colorTextSecondary,
                        }}>
                            <FileOutlined style={{ fontSize: '48px' }} />
                            <Text style={{ fontSize: '16px' }}>{resolvedEmptyMessage}</Text>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
