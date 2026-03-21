import { useMemo, useState } from 'react'
import { Modal, Button, Typography, Input, Select, Radio, Spin, Form } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useUsers } from '../../hooks/useUser'
import { useInstitutions } from '../../hooks/useInstitutionTrack'
import { useBasicToast, getApiErrorMessage } from '../../hooks/useBasicToast'
import { articleService } from '../../services/article.service'
import type { ReviewerDto, UserDto } from '../../models'

const { Text } = Typography

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
                error('Email không hợp lệ. Vui lòng kiểm tra lại.')
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
            error(`Không thể mời phản biện viên. ${getApiErrorMessage(e, 'Vui lòng thử lại.')}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            title="Quản lý reviewer"
            open={open}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose} disabled={isSubmitting}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleInvite}
                    loading={isSubmitting}
                    disabled={
                        entryMode === 'existing' && selectedReviewerIds.length === 0 ||
                        entryMode === 'manual' && (!manualReviewerName.trim() || !manualReviewerEmail.trim() || !manualReviewerInstitutionId)
                    }
                >
                    Xác nhận
                </Button>,
            ]}
        >
            <div style={{ marginBottom: '16px' }}>
                <Text style={{ display: 'block', marginBottom: '8px', color: '#8c8c8c' }}>
                    Phản biện đã được mời:
                </Text>
                {invitedReviewers.length === 0 ? (
                    <Text style={{ color: '#8c8c8c' }}>
                        Chưa có phản biện nào
                    </Text>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {invitedReviewers.map((r) => (
                            <Text key={r.id}>
                                {r.name} ({r.email})
                                {r.institution?.name ? ` - ${r.institution.name}` : ''}
                            </Text>
                        ))}
                    </div>
                )}
            </div>

            <Form.Item label="Phương thức mời reviewer" style={{ marginBottom: '16px' }}>
                <Radio.Group value={entryMode} onChange={(e) => setEntryMode(e.target.value as 'existing' | 'manual')}>
                    <Radio value="existing">Chọn từ danh sách người dùng hiện có</Radio>
                    <Radio value="manual">Nhập thông tin reviewer mới</Radio>
                </Radio.Group>
            </Form.Item>

            {entryMode === 'existing' ? (
                <Form.Item label="Chọn reviewer" required>
                    {isLoadingUsers ? (
                        <Spin />
                    ) : (
                        <Select
                            mode="multiple"
                            placeholder="Chọn reviewer"
                            value={selectedReviewerIds}
                            onChange={setSelectedReviewerIds}
                            options={reviewerUsers.map((user) => ({
                                value: user.id,
                                label: formatReviewerOption(user),
                            }))}
                        />
                    )}
                </Form.Item>
            ) : (
                <>
                    <Form.Item label="Họ và tên" required style={{ marginBottom: '16px' }}>
                        <Input
                            placeholder="Nhập họ và tên reviewer"
                            value={manualReviewerName}
                            onChange={(e) => setManualReviewerName(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Email" required style={{ marginBottom: '16px' }}>
                        <Input
                            type="email"
                            placeholder="Nhập email reviewer"
                            value={manualReviewerEmail}
                            onChange={(e) => setManualReviewerEmail(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Cơ quan" required>
                        {isLoadingInstitutions ? (
                            <Spin />
                        ) : (
                            <Select
                                placeholder="Chọn cơ quan"
                                value={manualReviewerInstitutionId || undefined}
                                onChange={(value) => setManualReviewerInstitutionId(value)}
                                options={institutions.map((institution) => ({
                                    value: institution.id,
                                    label: institution.name,
                                }))}
                            />
                        )}
                    </Form.Item>
                </>
            )}
        </Modal>
    )
}
