import { Input, Button, Typography, Select, Form, Alert, theme as antdTheme } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileOutlined, CloseOutlined } from '@ant-design/icons'
import { PdfViewer } from '../common/PdfViewer'
import { useNavigate, useSearchParams } from 'react-router'
import { articleService } from '../../services/article.service'
import { attachmentService } from '../../services/attachment.service'
import { articleVersionService } from '../../services/article-version.service'
import { AttachmentKind } from '../../constants/attachment-kind'
import { useInstitutions } from '../../hooks/useInstitutionTrack'
import { useSubmissionMetadata } from '../../hooks/useArticles'
import { useBasicToast } from '../../hooks/useBasicToast'
import { useCurrentUser } from '../../hooks/useUser'
import { useAuthStore } from '../../stores/authStore'
import type { InstitutionDto, SubmissionConferenceOptionDto, SubmissionTrackOptionDto } from '../../models'
import { useTranslation } from 'react-i18next'

const { Title, Text } = Typography

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
    const { t, i18n } = useTranslation('common')
    const { token } = antdTheme.useToken()

    useEffect(() => {
        document.title = `${t('submitArticle.title')} - Research Review`
    }, [t])

    const dropzoneBaseStyle = useMemo(() => ({
        border: `2px dashed ${token.colorBorder}`,
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center' as const,
        cursor: 'pointer',
        transition: 'all 0.2s',
    }), [token.colorBorder])

    const dropzoneActiveStyle = useMemo(() => ({
        ...dropzoneBaseStyle,
        border: `2px dashed ${token.colorPrimary}`,
    }), [dropzoneBaseStyle, token.colorPrimary])

    const [form] = Form.useForm()
    const [searchParams] = useSearchParams()
    const [mainFile, setMainFile] = useState<File | null>(null)
    const [supplementalFiles, setSupplementalFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        conclusion: '',
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
        const conferenceIdFromQuery = searchParams.get('conferenceId')
        if (!conferenceIdFromQuery) return
        setFormData((prev) => {
            if (prev.conferenceId === conferenceIdFromQuery) return prev
            return { ...prev, conferenceId: conferenceIdFromQuery, trackId: '', topicIds: [] }
        })
    }, [searchParams])

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
    const isRegisteredToConference = useMemo(() => {
        if (!formData.conferenceId) return false
        return (currentUser?.conferences ?? []).some(
            (membership) => membership.conferenceId === formData.conferenceId
        )
    }, [currentUser?.conferences, formData.conferenceId])
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
    const dateTimeLocale = i18n.language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'
    const institutionsMap = useMemo<Record<string, InstitutionDto>>(() => {
        const mapper: Record<string, InstitutionDto> = {}
        institutions.forEach((inst) => {
            mapper[inst.id] = inst
        })
        return mapper
    }, [institutions])

    const onDropMain = useCallback((acceptedFiles: File[]) => {
        const nextMainFile = acceptedFiles[0] ?? null
        setMainFile(nextMainFile)

        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl)
        }

        if (nextMainFile) {
            const nextUrl = URL.createObjectURL(nextMainFile)
            setPdfUrl(nextUrl)
            return
        }

        setPdfUrl(null)
    }, [pdfUrl])

    const onDropSupplemental = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        setSupplementalFiles((prev) => {
            const existing = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`))
            const next = [...prev]
            acceptedFiles.forEach((file) => {
                const key = `${file.name}-${file.size}-${file.lastModified}`
                if (!existing.has(key)) {
                    next.push(file)
                    existing.add(key)
                }
            })
            return next
        })
    }, [])

    const {
        getRootProps: getMainRootProps,
        getInputProps: getMainInputProps,
        isDragActive: isMainDragActive,
    } = useDropzone({
        onDrop: onDropMain,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxSize: 10485760, // 10MB
        multiple: false,
    })

    const {
        getRootProps: getSupplementalRootProps,
        getInputProps: getSupplementalInputProps,
        isDragActive: isSupplementalDragActive,
    } = useDropzone({
        onDrop: onDropSupplemental,
        maxSize: 104857600, // 100MB
        multiple: true,
    })

    const removeMainFile = () => {
        setMainFile(null)
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
        }
    }

    const removeSupplementalFile = (index: number) => {
        setSupplementalFiles(prev => prev.filter((_, i) => i !== index))
    }

    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
            }
        }
    }, [pdfUrl])

    const handleSubmit = () => {

        if (!formData.conferenceId) {
            error(t('submitArticle.errors.selectConference'))
            return
        }

        if (!isRegisteredToConference) {
            error(t('submitArticle.errors.registerConferenceRequired'))
            return
        }

        if (isDeadlinePassed) {
            error(t('submitArticle.errors.deadlinePassed'))
            return
        }

        if (!formData.trackId) {
            error(t('submitArticle.errors.selectTrack'))
            return
        }

        if (formData.topicIds.length === 0) {
            error(t('submitArticle.errors.selectTopic'))
            return
        }

        if (!mainFile) {
            error(t('submitArticle.errors.uploadMainPdf'))
            return
        }

        const invalidAuthor = authors.some(author => !author.name || !author.email || !author.institutionId)
        if (invalidAuthor) {
            error(t('submitArticle.errors.completeAuthorInfo'))
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
                    link: '',
                    conferenceId: formData.conferenceId,
                    trackId: formData.trackId,
                    topicIds: formData.topicIds,
                    authors: authorPayload,
                })
                const articleId = createResp.data?.id
                if (!articleId) {
                    throw new Error(t('submitArticle.errors.articleCreateFailed'))
                }

                const mainUploadResp = await attachmentService.uploadFile(articleId, mainFile, {
                    version: 1,
                    kind: AttachmentKind.SUBMISSION,
                })
                const mainAttachment = mainUploadResp.data
                if (!mainAttachment?.id) {
                    throw new Error(t('submitArticle.errors.mainUploadFailed'))
                }

                const versionResp = await articleVersionService.createVersion(articleId, {
                    versionNumber: 1,
                    mainAttachmentId: mainAttachment.id,
                })
                if (!versionResp.data?.id) {
                    throw new Error(t('submitArticle.errors.versionCreateFailed'))
                }

                for (const supplementalFile of supplementalFiles) {
                    const supplementalResp = await attachmentService.uploadFile(articleId, supplementalFile, {
                        version: 1,
                        kind: AttachmentKind.SUPPLEMENTAL,
                    })
                    const supplementalAttachmentId = supplementalResp.data?.id
                    if (!supplementalAttachmentId) {
                        throw new Error(t('submitArticle.errors.supplementalUploadFailed', { file: supplementalFile.name }))
                    }
                    await articleVersionService.attachSupplement(articleId, 1, {
                        attachmentId: supplementalAttachmentId,
                    })
                }

                // Persist a stable same-origin proxy URL (not a presigned S3 URL, which expires).
                await articleService.updateLink(articleId, `${apiBaseUrl}/articles/${articleId}/pdf`)

                // navigate to created article
                navigate(`/articles/${articleId}`)
            } catch (err) {
                console.error(err)
                const message = err instanceof Error ? err.message : t('submitArticle.errors.submitFailed')
                error(message)
            } finally {
                setUploading(false)
            }
        })()
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return t('submitArticle.fileSize.zero')
        const k = 1024
        const sizes = t('submitArticle.fileSize.units', { returnObjects: true }) as string[]
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

    const goToConferenceRegistration = () => {
        const params = new URLSearchParams()
        params.set('returnTo', '/articles/submit')
        if (formData.conferenceId) {
            params.set('conferenceId', formData.conferenceId)
        }
        navigate(`/conferences/register?${params.toString()}`)
    }

    return (
        <div style={{ ...styles.root, backgroundColor: token.colorBgLayout }}>
            <div style={styles.leftColumn}>
                <div>
                    <Title level={1}>{t('submitArticle.title')}</Title>
                </div>
                <Form form={form} layout="vertical" style={styles.form} onFinish={handleSubmit}>
                    <Form.Item label={t('submitArticle.articleTitleLabel')} required>
                        <Input
                            placeholder={t('submitArticle.articleTitlePlaceholder')}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </Form.Item>
                    <Form.Item label={t('submitArticle.abstractLabel')} required>
                        <Input.TextArea
                            placeholder={t('submitArticle.abstractPlaceholder')}
                            value={formData.abstract}
                            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                            required
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item label={t('submitArticle.conclusionLabel')} required>
                        <Input.TextArea
                            placeholder={t('submitArticle.conclusionPlaceholder')}
                            value={formData.conclusion}
                            onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                            required
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item label={t('submitArticle.mainFileLabel')} required tooltip={t('submitArticle.mainFileTooltip')}>
                        <div
                            {...getMainRootProps()}
                            style={isMainDragActive ? dropzoneActiveStyle : dropzoneBaseStyle}
                        >
                            <input type="file" {...getMainInputProps()} />
                            <FileOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
                            {isMainDragActive ? (
                                <Text>{t('submitArticle.mainFileDropActive')}</Text>
                            ) : (
                                <>
                                    <Text>{t('submitArticle.mainFileDropIdle')}</Text>
                                    <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                                        {t('submitArticle.mainFileHint')}
                                    </Text>
                                </>
                            )}
                        </div>
                        {mainFile && (
                            <div style={styles.fileList}>
                                <div style={{ ...styles.fileItem, border: `1px solid ${token.colorBorder}` }}>
                                    <div style={styles.fileInfo}>
                                        <FileOutlined style={{ fontSize: '24px' }} />
                                        <div>
                                            <Text strong>{mainFile.name}</Text>
                                            <Text type="secondary" style={{ display: 'block' }}>
                                                {formatFileSize(mainFile.size)}
                                            </Text>
                                        </div>
                                    </div>
                                    <CloseOutlined
                                        style={{ ...styles.removeButton, color: token.colorTextSecondary }}
                                        onClick={removeMainFile}
                                    />
                                </div>
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item label={t('submitArticle.supplementalLabel')} tooltip={t('submitArticle.supplementalTooltip')}>
                        <div
                            {...getSupplementalRootProps()}
                            style={isSupplementalDragActive ? dropzoneActiveStyle : dropzoneBaseStyle}
                        >
                            <input type="file" {...getSupplementalInputProps()} />
                            <FileOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
                            {isSupplementalDragActive ? (
                                <Text>{t('submitArticle.supplementalDropActive')}</Text>
                            ) : (
                                <>
                                    <Text>{t('submitArticle.supplementalDropIdle')}</Text>
                                    <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                                        {t('submitArticle.supplementalHint')}
                                    </Text>
                                </>
                            )}
                        </div>
                        {supplementalFiles.length > 0 && (
                            <div style={styles.fileList}>
                                {supplementalFiles.map((file, index) => (
                                    <div
                                        key={`${file.name}-${file.size}-${file.lastModified}`}
                                        style={{ ...styles.fileItem, border: `1px solid ${token.colorBorder}` }}
                                    >
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
                                            style={{ ...styles.removeButton, color: token.colorTextSecondary }}
                                            onClick={() => removeSupplementalFile(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item label={t('submitArticle.conferenceLabel')} required>
                        <Select
                            placeholder={t('submitArticle.conferencePlaceholder')}
                            value={formData.conferenceId || undefined}
                            onChange={(value) => setFormData({ ...formData, conferenceId: value, trackId: '', topicIds: [] })}
                            options={conferences.map((conference) => ({
                                value: conference.id,
                                label: `${conference.name} (${conference.shortName})`,
                            }))}
                        />
                    </Form.Item>
                    {formData.conferenceId && !isRegisteredToConference && (
                        <Alert
                            type="warning"
                            showIcon
                            message={t('submitArticle.registration.requiredMessage')}
                            description={t('submitArticle.registration.requiredDescription')}
                            action={
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={goToConferenceRegistration}
                                >
                                    {t('submitArticle.registration.goToRegistrationPage')}
                                </Button>
                            }
                        />
                    )}
                    {formData.conferenceId && isRegisteredToConference && (
                        <Alert
                            type="success"
                            showIcon
                            message={t('submitArticle.registration.registeredMessage')}
                        />
                    )}
                    {submissionDeadline && (
                        <Alert
                            type={isDeadlinePassed ? 'error' : 'info'}
                            showIcon
                            message={isDeadlinePassed ? t('submitArticle.deadlinePassed') : t('submitArticle.deadline')}
                            description={new Date(submissionDeadline).toLocaleString(dateTimeLocale)}
                        />
                    )}
                    <Form.Item label={t('submitArticle.trackLabel')} required>
                        <Select
                            placeholder={t('submitArticle.trackPlaceholder')}
                            value={formData.trackId || undefined}
                            disabled={!formData.conferenceId}
                            onChange={(value) => setFormData({ ...formData, trackId: value, topicIds: [] })}
                            options={tracks.map(track => ({
                                value: track.id,
                                label: track.name
                            }))}
                        />
                    </Form.Item>
                    <Form.Item label={t('submitArticle.topicsLabel')} required>
                        <Select
                            mode="multiple"
                            placeholder={t('submitArticle.topicsPlaceholder')}
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
                            <Text strong>{t('submitArticle.authorsList')}</Text>
                            <Button type="text" onClick={addAuthor}>
                                {t('submitArticle.addAuthor')}
                            </Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {authors.map((author, index) => (
                                <div key={author.id} style={{ ...styles.authorCard, border: `1px solid ${token.colorBorder}` }}>
                                    <Text strong>{t('submitArticle.authorNumber', { index: index + 1 })}</Text>
                                    <Form.Item label={t('submitArticle.authorNameLabel')} required>
                                        <Input
                                            placeholder={t('submitArticle.authorNamePlaceholder')}
                                            value={author.name}
                                            onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label={t('submitArticle.authorEmailLabel')} required>
                                        <Input
                                            type="email"
                                            placeholder={t('submitArticle.authorEmailPlaceholder')}
                                            value={author.email}
                                            onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label={t('submitArticle.authorInstitutionLabel')} required>
                                        <Select
                                            placeholder={t('submitArticle.authorInstitutionPlaceholder')}
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
                                            {institutionsMap[author.institutionId]?.name || t('submitArticle.noInstitutionSelected')}
                                        </Text>
                                        <Button
                                            type="default"
                                            onClick={() => removeAuthor(index)}
                                            disabled={authors.length === 1}
                                        >
                                            {t('submitArticle.removeAuthor')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={uploading}
                            disabled={isDeadlinePassed || !isRegisteredToConference}
                        >
                            {uploading ? t('submitArticle.submitting') : t('submitArticle.submit')}
                        </Button>
                    </div>
                </Form>
            </div>
            <div style={styles.rightColumn}>
                <PdfViewer 
                    fileUrl={pdfUrl}
                    emptyMessage={t('submitArticle.previewEmpty')}
                />
            </div>
        </div>
    )
}

export default SubmitArticle