import { useMemo, useState } from 'react'
import {
    Button,
    Combobox,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    Field,
    Input,
    Option,
    Radio,
    RadioGroup,
    Spinner,
    Text,
    tokens,
} from '@fluentui/react-components'
import { useQueryClient } from '@tanstack/react-query'
import { useUsers } from '../../hooks/useUser'
import { useInstitutions } from '../../hooks/useInstitutionTrack'
import { useBasicToast, getApiErrorMessage } from '../../hooks/useBasicToast'
import { articleService } from '../../services/article.service'
import type { ReviewerDto, UserDto } from '../../models'

export interface InviteReviewersDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    articleId: string
    invitedReviewers: ReviewerDto[]
}

const getInvitedUserIds = (invitedReviewers: ReviewerDto[]): Set<string> => {
    const ids = new Set<string>()
    for (const reviewer of invitedReviewers) {
        if (reviewer.user?.id) ids.add(reviewer.user.id)
    }
    return ids
}

const getInvitedEmails = (invitedReviewers: ReviewerDto[]): Set<string> => {
    const emails = new Set<string>()
    for (const reviewer of invitedReviewers) {
        if (reviewer.email) emails.add(reviewer.email.toLowerCase())
    }
    return emails
}

const formatReviewerOption = (user: UserDto): string => {
    const institutionName = user.institution?.name
    if (institutionName) return `${user.name} (${user.email}) - ${institutionName}`
    return `${user.name} (${user.email})`
}

export function InviteReviewersDialog({
    open,
    onOpenChange,
    articleId,
    invitedReviewers,
}: InviteReviewersDialogProps) {
    const queryClient = useQueryClient()
    const { success, error } = useBasicToast()

    const [entryMode, setEntryMode] = useState<'existing' | 'manual'>('existing')
    const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([])
    const [manualReviewerName, setManualReviewerName] = useState('')
    const [manualReviewerEmail, setManualReviewerEmail] = useState('')
    const [manualReviewerInstitutionId, setManualReviewerInstitutionId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data: usersResponse, isLoading: isLoadingUsers } = useUsers(
        0,
        100,
        { role: 'REVIEWER' },
        open,
    )

    const { data: institutionsResponse, isLoading: isLoadingInstitutions } = useInstitutions(0, 100)
    const institutions = useMemo(() => institutionsResponse?.data?.content ?? [], [institutionsResponse])

    const invitedUserIds = useMemo(() => getInvitedUserIds(invitedReviewers), [invitedReviewers])
    const invitedEmails = useMemo(() => getInvitedEmails(invitedReviewers), [invitedReviewers])

    const reviewerUsers = useMemo(() => {
        const all = usersResponse?.data?.content ?? []
        return all.filter((u) => !invitedUserIds.has(u.id) && !invitedEmails.has((u.email ?? '').toLowerCase()))
    }, [usersResponse, invitedUserIds, invitedEmails])

    const handleClose = () => {
        setEntryMode('existing')
        setSelectedReviewerIds([])
        setManualReviewerName('')
        setManualReviewerEmail('')
        setManualReviewerInstitutionId('')
        onOpenChange(false)
    }

    const handleInvite = async () => {
        if (!articleId) return

        if (entryMode === 'existing' && selectedReviewerIds.length === 0) return

        if (entryMode === 'manual') {
            if (!manualReviewerName.trim() || !manualReviewerEmail.trim() || !manualReviewerInstitutionId) return
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(manualReviewerEmail.trim())) {
                error('Email không hợp lệ.', 'Vui lòng kiểm tra lại.')
                return
            }
        }

        try {
            setIsSubmitting(true)

            if (entryMode === 'existing') {
                for (const reviewerId of selectedReviewerIds) {
                    const user = reviewerUsers.find((u) => u.id === reviewerId)
                    if (!user) continue

                    await articleService.assignReviewer(articleId, {
                        articleId,
                        userId: user.id,
                        name: user.name,
                        email: user.email,
                        institutionId: user.institution?.id ?? '',
                    })
                }
            } else {
                await articleService.assignReviewer(articleId, {
                    articleId,
                    name: manualReviewerName.trim(),
                    email: manualReviewerEmail.trim(),
                    institutionId: manualReviewerInstitutionId,
                })
            }

            success('Đã mời phản biện viên thành công.')
            queryClient.invalidateQueries({ queryKey: ['article', articleId] })
            handleClose()
        } catch (e) {
            error('Không thể mời phản biện viên.', getApiErrorMessage(e, 'Vui lòng thử lại.'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>Quản lý reviewer</DialogTitle>
                    <DialogContent>
                        <div style={{ marginBottom: '12px' }}>
                            <Text
                                size={200}
                                style={{ display: 'block', marginBottom: '6px', color: tokens.colorNeutralForeground3 }}
                            >
                                Phản biện đã được mời:
                            </Text>
                            {invitedReviewers.length === 0 ? (
                                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                                    Chưa có phản biện nào
                                </Text>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {invitedReviewers.map((r) => (
                                        <Text key={r.id} size={300}>
                                            {r.name} ({r.email})
                                            {r.institution?.name ? ` - ${r.institution.name}` : ''}
                                        </Text>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Field label="Phương thức mời reviewer" style={{ marginBottom: '12px' }}>
                            <RadioGroup value={entryMode} onChange={(_, data) => setEntryMode(data.value as 'existing' | 'manual')}>
                                <Radio value="existing" label="Chọn từ danh sách người dùng hiện có" />
                                <Radio value="manual" label="Nhập thông tin reviewer mới" />
                            </RadioGroup>
                        </Field>

                        {entryMode === 'existing' ? (
                            <Field label="Chọn reviewer" required>
                                {isLoadingUsers ? (
                                    <div style={{ padding: '8px 0' }}>
                                        <Spinner size="small" />
                                    </div>
                                ) : (
                                    <Combobox
                                        multiselect
                                        placeholder="Chọn reviewer"
                                        selectedOptions={selectedReviewerIds}
                                        onOptionSelect={(_, data) => setSelectedReviewerIds(data.selectedOptions)}
                                    >
                                        {reviewerUsers.map((user) => (
                                            <Option key={user.id} value={user.id} text={formatReviewerOption(user)}>
                                                {formatReviewerOption(user)}
                                            </Option>
                                        ))}
                                    </Combobox>
                                )}
                            </Field>
                        ) : (
                            <>
                                <Field label="Họ và tên" required style={{ marginBottom: '12px' }}>
                                    <Input
                                        placeholder="Nhập họ và tên reviewer"
                                        value={manualReviewerName}
                                        onChange={(_, data) => setManualReviewerName(data.value)}
                                    />
                                </Field>
                                <Field label="Email" required style={{ marginBottom: '12px' }}>
                                    <Input
                                        type="email"
                                        placeholder="Nhập email reviewer"
                                        value={manualReviewerEmail}
                                        onChange={(_, data) => setManualReviewerEmail(data.value)}
                                    />
                                </Field>
                                <Field label="Cơ quan" required>
                                    {isLoadingInstitutions ? (
                                        <div style={{ padding: '8px 0' }}>
                                            <Spinner size="small" />
                                        </div>
                                    ) : (
                                        <Combobox
                                            placeholder="Chọn cơ quan"
                                            value={institutions.find((i) => i.id === manualReviewerInstitutionId)?.name || ''}
                                            onOptionSelect={(_, data) => setManualReviewerInstitutionId(data.optionValue || '')}
                                        >
                                            {institutions.map((institution) => (
                                                <Option key={institution.id} value={institution.id} text={institution.name}>
                                                    {institution.name}
                                                </Option>
                                            ))}
                                        </Combobox>
                                    )}
                                </Field>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            appearance="primary"
                            onClick={handleInvite}
                            disabled={
                                isSubmitting ||
                                (entryMode === 'existing' && selectedReviewerIds.length === 0) ||
                                (entryMode === 'manual' && (!manualReviewerName.trim() || !manualReviewerEmail.trim() || !manualReviewerInstitutionId))
                            }
                        >
                            {isSubmitting ? 'Đang mời...' : 'Xác nhận'}
                        </Button>
                        <Button appearance="secondary" onClick={handleClose} disabled={isSubmitting}>
                            Hủy
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    )
}
