import { Input, Button, Typography, Select, Form, Alert } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileOutlined, CloseOutlined } from '@ant-design/icons'
import { PdfViewer } from '../common/PdfViewer'
import { useNavigate } from 'react-router'
import { articleService } from '../../services/article.service'
import { attachmentService } from '../../services/attachment.service'
import { AttachmentKind } from '../../constants/attachment-kind'
import { useInstitutions } from '../../hooks/useInstitutionTrack'
import { useSubmissionMetadata } from '../../hooks/useArticles'
import { useBasicToast } from '../../hooks/useBasicToast'
import { useCurrentUser } from '../../hooks/useUser'
import { useAuthStore } from '../../stores/authStore'
import type { InstitutionDto, SubmissionConferenceOptionDto, SubmissionTrackOptionDto } from '../../models'

const { Title, Text } = Typography

const dropzoneBaseStyle = {
    border: '2px dashed #d9d9d9',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
}

const dropzoneActiveStyle = {
    ...dropzoneBaseStyle,
    border: '2px dashed #1890ff',
    backgroundColor: '#fafafa',
}

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'row' as const,
        gap: '24px',
        padding: '32px 0',
        width: '100%',
        height: 'calc(100vh - 64px)',
    },
    leftColumn: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        width: '500px',
        flexShrink: 0,
        overflow: 'auto' as const,
        paddingLeft: '16px',
        paddingRight: '16px',
    },
    rightColumn: {
        display: 'flex',
        flex: 1,
        minWidth: '0',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    fileList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        marginTop: '16px',
    },
    fileItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#fafafa',
        borderRadius: '4px',
        border: '1px solid #d9d9d9',
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    removeButton: {
        cursor: 'pointer',
        color: '#8c8c8c',
    },
    authorCard: {
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    authorActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
    },
}

type AuthorForm = {
    id: string
    name: string
    email: string
    institutionId: string
}

const createAuthorForm = (): AuthorForm => ({
    id: Math.random().toString(36).slice(2),
    name: '',
    email: '',
    institutionId: '',
})

function SubmitArticle() {
    const [form] = Form.useForm()
    const [files, setFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        conclusion: '',
        link: '',
        conferenceId: '',
        trackId: '',
        topicIds: [] as string[],
    })
    const [authors, setAuthors] = useState<AuthorForm[]>([createAuthorForm()])
    
    // PDF URL for viewer
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const navigate = useNavigate()
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const { data: currentUserResponse } = useCurrentUser(Boolean(isAuthenticated))
    const currentUser = currentUserResponse?.data
    const { data: submissionMetadataResponse } = useSubmissionMetadata()
    const { data: institutionsData } = useInstitutions(0, 100)
    const { error } = useBasicToast()

    useEffect(() => {
        if (!currentUser) return
        setAuthors((prev) => {
            if (prev.length === 0) return prev

            const first = prev[0]
            const isFirstBlank = !first.name.trim() && !first.email.trim() && !first.institutionId.trim()
            if (!isFirstBlank) return prev

            return [
                {
                    ...first,
                    name: currentUser.name ?? '',
                    email: currentUser.email ?? '',
                    institutionId: currentUser.institution?.id ?? '',
                },
                ...prev.slice(1),
            ]
        })
    }, [currentUser])

    const conferences = useMemo(
        () => submissionMetadataResponse?.data?.conferences ?? [],
        [submissionMetadataResponse]
    )
    const selectedConference = useMemo<SubmissionConferenceOptionDto | null>(
        () => conferences.find((conference) => conference.id === formData.conferenceId) ?? null,
        [conferences, formData.conferenceId]
    )
    const tracks = useMemo<SubmissionTrackOptionDto[]>(
        () => selectedConference?.tracks ?? [],
        [selectedConference]
    )
    const selectedTrack = useMemo<SubmissionTrackOptionDto | null>(
        () => tracks.find((track) => track.id === formData.trackId) ?? null,
        [tracks, formData.trackId]
    )
    const topics = useMemo(
        () => selectedTrack?.topics ?? [],
        [selectedTrack]
    )
    const submissionDeadline = selectedConference?.submissionDeadline ?? null
    const isDeadlinePassed = useMemo(() => {
        if (!submissionDeadline) return false
        return new Date(submissionDeadline).getTime() < Date.now()
    }, [submissionDeadline])
    const institutions = useMemo(() => institutionsData?.data?.content ?? [], [institutionsData])
    const institutionsMap = useMemo<Record<string, InstitutionDto>>(() => {
        const mapper: Record<string, InstitutionDto> = {}
        institutions.forEach((inst) => {
            mapper[inst.id] = inst
        })
        return mapper
    }, [institutions])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles)
        
        // Create object URL for PDF preview
        if (acceptedFiles.length > 0 && acceptedFiles[0].type === 'application/pdf') {
            const url = URL.createObjectURL(acceptedFiles[0])
            setPdfUrl(url)
        } else {
            setPdfUrl(null)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxSize: 10485760, // 10MB
        multiple: false,
    })
    
    const inputProps = getInputProps()

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        // Clean up object URL and reset PDF state
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
        }
    }

    const handleSubmit = () => {

        if (!formData.conferenceId) {
            error('Vui lòng chọn hội nghị')
            return
        }

        if (isDeadlinePassed) {
            error('Đã quá hạn nộp bài cho hội nghị đã chọn')
            return
        }

        if (!formData.trackId) {
            error('Vui lòng chọn chủ đề (track) cho bài báo')
            return
        }

        if (formData.topicIds.length === 0) {
            error('Vui lòng chọn ít nhất một topic')
            return
        }

        if (!formData.link && files.length === 0) {
            error('Vui lòng chọn tệp hoặc nhập liên kết tới tài liệu')
            return
        }

        const invalidAuthor = authors.some(author => !author.name || !author.email || !author.institutionId)
        if (invalidAuthor) {
            error('Vui lòng điền đầy đủ thông tin cho từng tác giả')
            return
        }

        const authorPayload = authors.map(author => {
            const institution = institutionsMap[author.institutionId]
            return {
                name: author.name,
                email: author.email,
                institution: institution ?? {
                    id: author.institutionId,
                    name: '',
                    country: '',
                    website: '',
                    logo: '',
                },
            }
        })

        void (async function submitArticle() {
            setUploading(true)
            try {
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

                // create article first with empty link (if file present) or provided link
                const createResp = await articleService.create({
                    title: formData.title,
                    abstract: formData.abstract,
                    conclusion: formData.conclusion,
                    link: files.length > 0 ? '' : formData.link,
                    conferenceId: formData.conferenceId,
                    trackId: formData.trackId,
                    topicIds: formData.topicIds,
                    authors: authorPayload,
                })
                const articleId = createResp.data?.id
                if (!articleId) {
                    throw new Error('Article creation failed')
                }

                if (files.length > 0) {
                    const file = files[0]
                    const uploadResp = await attachmentService.uploadFile(articleId, file, {
                        version: 1,
                        kind: AttachmentKind.SUBMISSION,
                    })
                    const attachment = uploadResp.data
                    if (!attachment?.id) {
                        throw new Error('Attachment upload failed')
                    }

                    // Persist a stable same-origin proxy URL (not a presigned S3 URL, which expires).
                    await articleService.updateLink(articleId, `${apiBaseUrl}/articles/${articleId}/pdf`)
                }

                // navigate to created article
                navigate(`/articles/${articleId}`)
            } catch (err) {
                console.error(err)
                const message = err instanceof Error ? err.message : 'Unable to submit article'
                error(message)
            } finally {
                setUploading(false)
            }
        })()
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const handleAuthorChange = (index: number, field: 'name' | 'email' | 'institutionId', value: string) => {
        setAuthors(prev => {
            const next = [...prev]
            next[index] = { ...next[index], [field]: value }
            return next
        })
    }

    const addAuthor = () => {
        setAuthors(prev => [...prev, createAuthorForm()])
    }

    const removeAuthor = (index: number) => {
        setAuthors(prev => {
            if (prev.length === 1) {
                return prev
            }
            return prev.filter((_, i) => i !== index)
        })
    }

    return (
        <div style={styles.root}>
            <div style={styles.leftColumn}>
                <div>
                    <Title level={1}>Nộp bài báo</Title>
                </div>
                <Form form={form} layout="vertical" style={styles.form} onFinish={handleSubmit}>
                    <Form.Item label="Tên bài báo" required>
                        <Input
                            placeholder="Nhập tên bài báo"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </Form.Item>
                    <Form.Item label="Tóm tắt" required>
                        <Input.TextArea
                            placeholder="Nhập tóm tắt bài báo"
                            value={formData.abstract}
                            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                            required
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item label="Kết luận" required>
                        <Input.TextArea
                            placeholder="Nhập phần kết luận"
                            value={formData.conclusion}
                            onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                            required
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item label="Tệp tài liệu" required tooltip="Kéo thả file để tải lên; hệ thống sẽ tự sinh liên kết">
                        <div
                            {...getRootProps()}
                            style={isDragActive ? dropzoneActiveStyle : dropzoneBaseStyle}
                        >
                            <input type="file" {...inputProps} />
                            <FileOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
                            {isDragActive ? (
                                <Text>Thả file vào đây...</Text>
                            ) : (
                                <>
                                    <Text>Kéo thả file vào đây hoặc click để chọn file</Text>
                                    <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                                        PDF, DOC, DOCX (tối đa 10MB)
                                    </Text>
                                </>
                            )}
                        </div>
                        {files.length > 0 && (
                            <div style={styles.fileList}>
                                {files.map((file, index) => (
                                    <div key={index} style={styles.fileItem}>
                                        <div style={styles.fileInfo}>
                                            <FileOutlined style={{ fontSize: '24px' }} />
                                            <div>
                                                <Text strong>{file.name}</Text>
                                                <Text type="secondary" style={{ display: 'block' }}>
                                                    {formatFileSize(file.size)}
                                                </Text>
                                            </div>
                                        </div>
                                        <CloseOutlined
                                            style={styles.removeButton}
                                            onClick={() => removeFile(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item label="Hội nghị" required>
                        <Select
                            placeholder="Chọn hội nghị"
                            value={formData.conferenceId || undefined}
                            onChange={(value) => setFormData({ ...formData, conferenceId: value, trackId: '', topicIds: [] })}
                            options={conferences.map((conference) => ({
                                value: conference.id,
                                label: `${conference.name} (${conference.shortName})`,
                            }))}
                        />
                    </Form.Item>
                    {submissionDeadline && (
                        <Alert
                            type={isDeadlinePassed ? 'error' : 'info'}
                            showIcon
                            message={isDeadlinePassed ? 'Đã quá hạn nộp bài' : 'Hạn nộp bài'}
                            description={new Date(submissionDeadline).toLocaleString('vi-VN')}
                        />
                    )}
                    <Form.Item label="Chủ đề (Track)" required>
                        <Select
                            placeholder="Chọn track"
                            value={formData.trackId || undefined}
                            disabled={!formData.conferenceId}
                            onChange={(value) => setFormData({ ...formData, trackId: value, topicIds: [] })}
                            options={tracks.map(track => ({
                                value: track.id,
                                label: track.name
                            }))}
                        />
                    </Form.Item>
                    <Form.Item label="Topics" required>
                        <Select
                            mode="multiple"
                            placeholder="Chọn topic"
                            value={formData.topicIds}
                            disabled={!formData.trackId}
                            onChange={(value) => setFormData({ ...formData, topicIds: value })}
                            options={topics.map((topic) => ({
                                value: topic.id,
                                label: topic.name,
                            }))}
                        />
                    </Form.Item>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text strong>Danh sách tác giả</Text>
                            <Button type="text" onClick={addAuthor}>
                                Thêm tác giả
                            </Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {authors.map((author, index) => (
                                <div key={author.id} style={styles.authorCard}>
                                    <Text strong>Tác giả #{index + 1}</Text>
                                    <Form.Item label="Tên tác giả" required>
                                        <Input
                                            placeholder="Họ và tên"
                                            value={author.name}
                                            onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Email" required>
                                        <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            value={author.email}
                                            onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Đơn vị" required>
                                        <Select
                                            placeholder="Chọn đơn vị"
                                            value={author.institutionId || undefined}
                                            onChange={(value) => handleAuthorChange(index, 'institutionId', value)}
                                            options={institutions.map(inst => ({
                                                value: inst.id,
                                                label: inst.name
                                            }))}
                                        />
                                    </Form.Item>
                                    <div style={styles.authorActions}>
                                        <Text type="secondary">
                                            {institutionsMap[author.institutionId]?.name || 'Chưa chọn đơn vị'}
                                        </Text>
                                        <Button
                                            type="default"
                                            onClick={() => removeAuthor(index)}
                                            disabled={authors.length === 1}
                                        >
                                            Xóa tác giả
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Form.Item label="File bài báo (tùy chọn)" tooltip="Dùng để xem trước trước khi gửi lên hệ thống">
                        <div
                            {...getRootProps()}
                            style={isDragActive ? dropzoneActiveStyle : dropzoneBaseStyle}
                        >
                            <input type="file" {...inputProps} />
                            <FileOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
                            {isDragActive ? (
                                <Text>Thả file vào đây...</Text>
                            ) : (
                                <>
                                    <Text>Kéo thả file vào đây hoặc click để chọn file</Text>
                                    <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                                        PDF, DOC, DOCX (tối đa 10MB)
                                    </Text>
                                </>
                            )}
                        </div>
                        {files.length > 0 && (
                            <div style={styles.fileList}>
                                {files.map((file, index) => (
                                    <div key={index} style={styles.fileItem}>
                                        <div style={styles.fileInfo}>
                                            <FileOutlined style={{ fontSize: '24px' }} />
                                            <div>
                                                <Text strong>{file.name}</Text>
                                                <Text type="secondary" style={{ display: 'block' }}>
                                                    {formatFileSize(file.size)}
                                                </Text>
                                            </div>
                                        </div>
                                        <CloseOutlined
                                            style={styles.removeButton}
                                            onClick={() => removeFile(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                        <Button type="primary" htmlType="submit" size="large" loading={uploading} disabled={isDeadlinePassed}>
                            {uploading ? 'Đang nộp bài...' : 'Nộp bài báo'}
                        </Button>
                    </div>
                </Form>
            </div>
            <div style={styles.rightColumn}>
                <PdfViewer 
                    fileUrl={pdfUrl ?? (formData.link || null)} 
                    emptyMessage="Tải lên file hoặc nhập liên kết để xem trước"
                />
            </div>
        </div>
    )
}

export default SubmitArticle