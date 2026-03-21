import { useState } from 'react'
import { Modal, Button, Typography, Input, Alert } from 'antd'
import { FileOutlined } from '@ant-design/icons'
import { api } from '../../services/api'

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
    backgroundColor: '#fafafa',
    border: '2px dashed #d9d9d9',
  },
  dropZoneActive: {
    backgroundColor: '#f0f0f0',
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
    color: '#8c8c8c',
  },
} as const

interface SubmitRevisionProps {
  articleId: string
  onSuccess?: () => void
  isOpen: boolean
  onClose: () => void
}

export const SubmitRevision = ({ articleId, onSuccess, isOpen, onClose }: SubmitRevisionProps) => {
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
        setError('Vui lòng chọn tệp PDF')
        setSelectedFile(null)
      } else {
        setError(null)
        setSelectedFile(file)
      }
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn tệp PDF')
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
      const errorMsg = err instanceof Error ? err.message : 'Không thể nộp bài sửa chữa'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      title="Nộp Bài Sửa Chữa"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isLoading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={!selectedFile}
          loading={isLoading}
        >
          Nộp Bài Sửa Chữa
        </Button>,
      ]}
      width={600}
    >
      <div style={styles.content}>
        <div style={styles.section}>
          <Text strong>Tệp PDF sửa chữa</Text>
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
                  setError('Vui lòng chọn tệp PDF')
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
                  <Text strong>Kéo thả tệp PDF hoặc bấm để chọn</Text>
                  <Text style={styles.helperText}>Chỉ hỗ trợ tệp PDF</Text>
                </>
              )}
            </label>
          </div>
        </div>

        <div style={styles.section}>
          <Text strong>Ghi chú sửa chữa (tùy chọn)</Text>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mô tả những thay đổi bạn đã thực hiện..."
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
