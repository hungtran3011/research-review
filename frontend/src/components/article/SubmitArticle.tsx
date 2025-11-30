import { Field, Input, Button, Text, makeStyles } from '@fluentui/react-components'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentRegular, Dismiss24Regular } from '@fluentui/react-icons'
import { PdfViewer } from '../common/PdfViewer'

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
})

function SubmitArticle() {
    const classes = useStyles()
    const [files, setFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        keywords: '',
        authors: '',
    })
    
    // PDF URL for viewer
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

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
        // Handle form submission with files and formData
        console.log('Form data:', formData)
        console.log('Files:', files)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
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
                        <Input
                            placeholder="Nhập tóm tắt bài báo"
                            value={formData.abstract}
                            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                            required
                        />
                    </Field>
                    <Field label="Từ khóa" required hint="Các từ khóa cách nhau bởi dấu phẩy">
                        <Input
                            placeholder="VD: Machine Learning, AI, Deep Learning"
                            value={formData.keywords}
                            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                            required
                        />
                    </Field>
                    <Field label="Tác giả" required hint="Danh sách tác giả cách nhau bởi dấu phẩy">
                        <Input
                            placeholder="VD: Nguyễn Văn A, Trần Thị B"
                            value={formData.authors}
                            onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                            required
                        />
                    </Field>
                    <Field label="File bài báo" required hint="Chấp nhận file PDF, DOC, DOCX (tối đa 10MB)">
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
                        <Button appearance="primary" type="submit" size="large">
                            Nộp bài báo
                        </Button>
                    </div>
                </form>
            </div>
            <div className={classes.rightColumn}>
                <PdfViewer 
                    fileUrl={pdfUrl} 
                    emptyMessage="Tải lên file PDF để xem trước"
                />
            </div>
        </div>
    )
}

export default SubmitArticle