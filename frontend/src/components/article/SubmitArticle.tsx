import { Field, Input, Button, Text, makeStyles, Textarea, Dropdown, Option } from '@fluentui/react-components'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentRegular, Dismiss24Regular } from '@fluentui/react-icons'
import { PdfViewer } from '../common/PdfViewer'
import { useNavigate } from 'react-router'
import { articleService } from '../../services/article.service'
import { attachmentService } from '../../services/attachment.service'
import { AttachmentKind } from '../../constants/attachment-kind'
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack'
import { useBasicToast } from '../../hooks/useBasicToast'
import { useCurrentUser } from '../../hooks/useUser'
import { useAuthStore } from '../../stores/authStore'
import type { InstitutionDto } from '../../models'

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        gap: '24px',
        padding: '32px 0',
        width: '100%',
        height: 'calc(100vh - 64px)',
        
        '@media screen and (max-width: 768px)': {
            flexDirection: 'column',
            alignItems: 'center'
        }
    },
    leftColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '500px',
        flexShrink: 0,
        overflow: 'auto',
        paddingLeft: '16px',
        paddingRight: '16px',
    },
    rightColumn: {
        display: 'flex',
        flex: 1,
        minWidth: '0',

        '@media screen and (max-width: 768px)': {
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            height: '800px'
        }
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    dropzone: {
        border: '2px dashed var(--colorNeutralStroke1)',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    dropzoneActive: {
        border: '2px dashed var(--colorBrandStroke1)',
        backgroundColor: 'var(--colorNeutralBackground1Pressed)',
    },
    dropzoneHover: {
        border: '2px dashed var(--colorBrandStroke1)',
        backgroundColor: 'var(--colorNeutralBackground1Hover)',
    },
    dropzoneDisabled: {
        cursor: 'not-allowed',
        opacity: 0.6,
    },
    fileList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '16px',
    },
    fileItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: 'var(--colorNeutralBackground1)',
        borderRadius: '4px',
        border: '1px solid var(--colorNeutralStroke1)',
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    removeButton: {
        cursor: 'pointer',
        color: 'var(--colorNeutralForeground2)',
    },
    authorCard: {
        border: '1px solid var(--colorNeutralStroke1)',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    authorActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
    },
})

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
    const classes = useStyles()
    const [files, setFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        conclusion: '',
        link: '',
        trackId: '',
    })
    const [authors, setAuthors] = useState<AuthorForm[]>([createAuthorForm()])
    
    // PDF URL for viewer
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const navigate = useNavigate()
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const { data: currentUserResponse } = useCurrentUser(Boolean(isAuthenticated))
    const currentUser = currentUserResponse?.data
    const { data: tracksData } = useTracks()
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

    const tracks = useMemo(() => tracksData?.data ?? [], [tracksData])
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.trackId) {
            error('Vui lòng chọn chủ đề (track) cho bài báo')
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
                    trackId: formData.trackId,
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
        <div className={classes.root}>
            <div className={classes.leftColumn}>
                <div>
                    <Text as="h1" size={600} weight="bold">Nộp bài báo</Text>
                </div>
                <form className={classes.form} onSubmit={handleSubmit}>
                    <Field label="Tên bài báo" required>
                        <Input
                            placeholder="Nhập tên bài báo"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </Field>
                    <Field label="Tóm tắt" required>
                        <Textarea
                            placeholder="Nhập tóm tắt bài báo"
                            value={formData.abstract}
                            onChange={(_, data) => setFormData({ ...formData, abstract: data.value })}
                            required
                            rows={4}
                        />
                    </Field>
                    <Field label="Kết luận" required>
                        <Textarea
                            placeholder="Nhập phần kết luận"
                            value={formData.conclusion}
                            onChange={(_, data) => setFormData({ ...formData, conclusion: data.value })}
                            required
                            rows={4}
                        />
                    </Field>
                    <Field label="Tệp tài liệu" required hint="Kéo thả file để tải lên; hệ thống sẽ tự sinh liên kết">
                        <div
                            {...getRootProps()}
                            className={`${classes.dropzone} ${isDragActive ? classes.dropzoneActive : ''}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <input type="file" {...inputProps} />
                            <DocumentRegular fontSize={48} />
                            {isDragActive ? (
                                <Text>Thả file vào đây...</Text>
                            ) : (
                                <>
                                    <Text>Kéo thả file vào đây hoặc click để chọn file</Text>
                                    <Text size={200} style={{ marginTop: '8px', color: 'var(--colorNeutralForeground3)' }}>
                                        PDF, DOC, DOCX (tối đa 10MB)
                                    </Text>
                                </>
                            )}
                        </div>
                        {files.length > 0 && (
                            <div className={classes.fileList}>
                                {files.map((file, index) => (
                                    <div key={index} className={classes.fileItem}>
                                        <div className={classes.fileInfo}>
                                            <DocumentRegular fontSize={24} />
                                            <div>
                                                <Text weight="semibold">{file.name}</Text>
                                                <Text size={200} style={{ display: 'block', color: 'var(--colorNeutralForeground3)' }}>
                                                    {formatFileSize(file.size)}
                                                </Text>
                                            </div>
                                        </div>
                                        <Dismiss24Regular
                                            className={classes.removeButton}
                                            onClick={() => removeFile(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Field>
                    <Field label="Chủ đề (Track)" required>
                        <Dropdown
                            placeholder="Chọn track"
                            selectedOptions={formData.trackId ? [formData.trackId] : []}
                            onOptionSelect={(_, data) => setFormData({ ...formData, trackId: data.optionValue ?? '' })}
                        >
                            {tracks.map(track => (
                                <Option key={track.id} value={track.id} text={track.name}>
                                    {track.name}
                                </Option>
                            ))}
                        </Dropdown>
                    </Field>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text weight="semibold">Danh sách tác giả</Text>
                            <Button type="button" appearance="subtle" onClick={addAuthor}>
                                Thêm tác giả
                            </Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {authors.map((author, index) => (
                                <div key={author.id} className={classes.authorCard}>
                                    <Text weight="semibold">Tác giả #{index + 1}</Text>
                                    <Field label="Tên tác giả" required>
                                        <Input
                                            placeholder="Họ và tên"
                                            value={author.name}
                                            onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Email" required>
                                        <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            value={author.email}
                                            onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Đơn vị" required>
                                        <Dropdown
                                            placeholder="Chọn đơn vị"
                                            selectedOptions={author.institutionId ? [author.institutionId] : []}
                                            onOptionSelect={(_, data) => handleAuthorChange(index, 'institutionId', data.optionValue ?? '')}
                                        >
                                            {institutions.map(inst => (
                                                <Option key={inst.id} value={inst.id} text={inst.name}>
                                                    {inst.name}
                                                </Option>
                                            ))}
                                        </Dropdown>
                                    </Field>
                                    <div className={classes.authorActions}>
                                        <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                                            {institutionsMap[author.institutionId]?.name || 'Chưa chọn đơn vị'}
                                        </Text>
                                        <Button
                                            type="button"
                                            appearance="secondary"
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
                    <Field label="File bài báo (tùy chọn)" hint="Dùng để xem trước trước khi gửi lên hệ thống">
                        <div
                            {...getRootProps()}
                            className={`${classes.dropzone} ${isDragActive ? classes.dropzoneActive : ''}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <input type="file" {...inputProps} />
                            <DocumentRegular fontSize={48} />
                            {isDragActive ? (
                                <Text>Thả file vào đây...</Text>
                            ) : (
                                <>
                                    <Text>Kéo thả file vào đây hoặc click để chọn file</Text>
                                    <Text size={200} style={{ marginTop: '8px', color: 'var(--colorNeutralForeground3)' }}>
                                        PDF, DOC, DOCX (tối đa 10MB)
                                    </Text>
                                </>
                            )}
                        </div>
                        {files.length > 0 && (
                            <div className={classes.fileList}>
                                {files.map((file, index) => (
                                    <div key={index} className={classes.fileItem}>
                                        <div className={classes.fileInfo}>
                                            <DocumentRegular fontSize={24} />
                                            <div>
                                                <Text weight="semibold">{file.name}</Text>
                                                <Text size={200} style={{ display: 'block', color: 'var(--colorNeutralForeground3)' }}>
                                                    {formatFileSize(file.size)}
                                                </Text>
                                            </div>
                                        </div>
                                        <Dismiss24Regular
                                            className={classes.removeButton}
                                            onClick={() => removeFile(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                        <Button appearance="primary" type="submit" size="large" disabled={uploading}>
                            {uploading ? 'Đang nộp bài...' : 'Nộp bài báo'}
                        </Button>
                    </div>
                </form>
            </div>
            <div className={classes.rightColumn}>
                <PdfViewer 
                    fileUrl={pdfUrl ?? (formData.link || null)} 
                    emptyMessage="Tải lên file hoặc nhập liên kết để xem trước"
                />
            </div>
        </div>
    )
}

export default SubmitArticle