import { useState } from 'react'
import { Modal, Button, Typography, Input, Alert } from 'antd'
import { FileOutlined } from '@ant-design/icons'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

const styles = {
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  dropZone: {
    marginTop: '12px',
    padding: '32px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: '2px dashed #d9d9d9',
  },
  dropZoneActive: {
    border: '2px dashed #1890ff',
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  helperText: {
  },
} as const

interface SubmitRevisionProps {
  articleId: string
  onSuccess?: () => void
  isOpen: boolean
  onClose: () => void
}

export const SubmitRevision = ({ articleId, onSuccess, isOpen, onClose }: SubmitRevisionProps) => {
  const { t } = useTranslation('common')
  const fileInputId = 'submit-revision-file'
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError(t('submitRevision.errors.selectPdf'))
        setSelectedFile(null)
      } else {
        setError(null)
        setSelectedFile(file)
      }
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError(t('submitRevision.errors.selectPdf'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('notes', notes)

      await api.post(`/articles/${articleId}/revisions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setSelectedFile(null)
      setNotes('')
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t('submitRevision.errors.submitFailed')
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      title={t('submitRevision.title')}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isLoading}>
          {t('submitRevision.actions.cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={!selectedFile}
          loading={isLoading}
        >
          {t('submitRevision.actions.submit')}
        </Button>,
      ]}
      width={600}
    >
      <div style={styles.content}>
        <div style={styles.section}>
          <Text strong>{t('submitRevision.revisionPdfLabel')}</Text>
          <div
            style={isDragActive ? { ...styles.dropZone, ...styles.dropZoneActive } : styles.dropZone}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragActive(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragActive(false)
              const files = e.dataTransfer.files
              if (files && files.length > 0) {
                const file = files[0]
                if (file.name.toLowerCase().endsWith('.pdf')) {
                  setSelectedFile(file)
                  setError(null)
                } else {
                  setError(t('submitRevision.errors.selectPdf'))
                }
              }
            }}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={styles.fileInput}
              id={fileInputId}
            />
            <label htmlFor={fileInputId} style={styles.fileLabel}>
              <FileOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              {selectedFile ? (
                <>
                  <Text strong>{selectedFile.name}</Text>
                  <Text style={styles.helperText}>
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Text>
                </>
              ) : (
                <>
                  <Text strong>{t('submitRevision.dropzone.primary')}</Text>
                  <Text style={styles.helperText}>{t('submitRevision.dropzone.secondary')}</Text>
                </>
              )}
            </label>
          </div>
        </div>

        <div style={styles.section}>
          <Text strong>{t('submitRevision.notes.label')}</Text>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('submitRevision.notes.placeholder')}
            rows={6}
          />
        </div>

        {error && (
          <Alert message={error} type="error" showIcon />
        )}
      </div>
    </Modal>
  )
}
