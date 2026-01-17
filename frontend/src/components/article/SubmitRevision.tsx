import { useId } from '@fluentui/react-utilities'
import { useState } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Textarea,
  Text,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { DocumentRegular } from '@fluentui/react-icons'
import { api } from '../../services/api'

interface SubmitRevisionProps {
  articleId: string
  onSuccess?: () => void
  isOpen: boolean
  onClose: () => void
}

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    width: '100%',
    maxWidth: '560px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  dropZone: {
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalL,

    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
    cursor: 'pointer',
    transitionProperty: 'background, border-color',
    transitionDuration: '150ms',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  dropZoneActive: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  helperText: {
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    marginTop: tokens.spacingVerticalXS,
  },
  errorBox: {
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorPaletteRedBackground1,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
  textArea: {
    marginTop: tokens.spacingVerticalS,
    width: '100%',
  },
})

export const SubmitRevision = ({ articleId, onSuccess, isOpen, onClose }: SubmitRevisionProps) => {
  const classes = useStyles()
  const fileInputId = useId('submit-revision-file')
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
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Nộp Bài Sửa Chữa</DialogTitle>
          <DialogContent className={classes.content}>
            <div className={classes.section}>
              <Text weight="semibold" size={300}>
                Tệp PDF sửa chữa
              </Text>
              <div
                className={`${classes.dropZone} ${isDragActive ? classes.dropZoneActive : ''}`}
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
                  className={classes.fileInput}
                  id={fileInputId}
                />
                <label htmlFor={fileInputId} className={classes.fileLabel}>
                  <DocumentRegular fontSize={32} style={{ marginBottom: tokens.spacingVerticalS }} />
                  {selectedFile ? (
                    <>
                      <Text size={300} weight="semibold">
                        {selectedFile.name}
                      </Text>
                      <Text size={200} className={classes.helperText}>
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text size={300} weight="semibold">
                        Kéo thả tệp PDF hoặc bấm để chọn
                      </Text>
                      <Text size={200} className={classes.helperText}>
                        Chỉ hỗ trợ tệp PDF
                      </Text>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className={classes.section}>
              <Text weight="semibold" size={300}>
                Ghi chú sửa chữa (tùy chọn)
              </Text>
              <Textarea
                value={notes}
                onChange={(_, data) => setNotes(data.value)}
                placeholder="Mô tả những thay đổi bạn đã thực hiện..."
                rows={6}
                className={classes.textArea}
              />
            </div>

            {error && (
              <div className={classes.errorBox}>
                <Text size={300} className={classes.errorText}>
                  {error}
                </Text>
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button
              appearance="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={!selectedFile || isLoading}
              icon={isLoading ? <Spinner size="tiny" /> : undefined}
            >
              {isLoading ? 'Đang nộp...' : 'Nộp Bài Sửa Chữa'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
