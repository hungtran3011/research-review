import { useMemo, useState } from 'react'
import { Modal, Button, Typography, Input, Select, Radio, Spin, Form } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useInstitutions } from '../../hooks/useInstitutionTrack'
import { useBasicToast, getApiErrorMessage } from '../../hooks/useBasicToast'
import { articleService } from '../../services/article.service'
import type { ReviewerDto, UserDto } from '../../models'
import { useTranslation } from 'react-i18next'

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
    const { t } = useTranslation('common')
    const queryClient = useQueryClient()
    const { success, error } = useBasicToast()

    const [entryMode, setEntryMode] = useState<'existing' | 'manual'>('existing')
    const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([])
    const [manualReviewerName, setManualReviewerName] = useState('')
    const [manualReviewerEmail, setManualReviewerEmail] = useState('')
    const [manualReviewerInstitutionId, setManualReviewerInstitutionId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [removingReviewerId, setRemovingReviewerId] = useState<string | null>(null)

    const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['reviewerCandidates', articleId],
        queryFn: () => articleService.getReviewerCandidates(articleId),
        enabled: open && !!articleId,
    })

    const { data: institutionsResponse, isLoading: isLoadingInstitutions } = useInstitutions(0, 100)
    const institutions = useMemo(() => institutionsResponse?.data?.content ?? [], [institutionsResponse])

    const invitedUserIds = useMemo(() => getInvitedUserIds(invitedReviewers), [invitedReviewers])
    const invitedEmails = useMemo(() => getInvitedEmails(invitedReviewers), [invitedReviewers])

    const reviewerUsers = useMemo(() => {
        const all: UserDto[] = usersResponse?.data ?? []
        return all.filter((u: UserDto) => !invitedUserIds.has(u.id) && !invitedEmails.has((u.email ?? '').toLowerCase()))
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
                error(t('inviteReviewersDialog.errors.invalidEmail'))
                return
            }
        }

        try {
            setIsSubmitting(true)

            if (entryMode === 'existing') {
                for (const reviewerId of selectedReviewerIds) {
                    const user = reviewerUsers.find((u: UserDto) => u.id === reviewerId)
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

            success(t('inviteReviewersDialog.messages.inviteSuccess'))
            queryClient.invalidateQueries({ queryKey: ['article', articleId] })
            handleClose()
        } catch (e) {
            error(`${t('inviteReviewersDialog.messages.inviteFailedPrefix')}${getApiErrorMessage(e, t('inviteReviewersDialog.messages.tryAgain'))}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveReviewer = async (reviewerId: string) => {
        if (!articleId) return
        setRemovingReviewerId(reviewerId)
        try {
            await articleService.unassignReviewer(articleId, reviewerId)
            success(t('inviteReviewersDialog.messages.removeSuccess'))
            queryClient.invalidateQueries({ queryKey: ['article', articleId] })
        } catch (e) {
            error(`${t('inviteReviewersDialog.messages.removeFailedPrefix')}${getApiErrorMessage(e, t('inviteReviewersDialog.messages.tryAgain'))}`)
        } finally {
            setRemovingReviewerId(null)
        }
    }

    return (
        <Modal
            title={t('inviteReviewersDialog.title')}
            open={open}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose} disabled={isSubmitting}>
                    {t('inviteReviewersDialog.actions.cancel')}
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
                    {t('inviteReviewersDialog.actions.confirm')}
                </Button>,
            ]}
        >
            <div style={{ marginBottom: '16px' }}>
                <Text type='secondary' style={{ display: 'block', marginBottom: '8px' }}>
                    {t('inviteReviewersDialog.invitedReviewersLabel')}
                </Text>
                {invitedReviewers.length === 0 ? (
                    <Text type='secondary'>
                        {t('inviteReviewersDialog.noInvitedReviewers')}
                    </Text>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {invitedReviewers.map((r) => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                                <Text>
                                    {r.name} ({r.email})
                                    {r.institution?.name ? ` - ${r.institution.name}` : ''}
                                </Text>
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    loading={removingReviewerId === r.id}
                                    onClick={() => handleRemoveReviewer(r.id)}
                                    title={t('inviteReviewersDialog.actions.remove')}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Form.Item label={t('inviteReviewersDialog.inviteMethodLabel')} style={{ marginBottom: '16px' }}>
                <Radio.Group value={entryMode} onChange={(e) => setEntryMode(e.target.value as 'existing' | 'manual')}>
                    <Radio value="existing">{t('inviteReviewersDialog.methods.existing')}</Radio>
                    <Radio value="manual">{t('inviteReviewersDialog.methods.manual')}</Radio>
                </Radio.Group>
            </Form.Item>

            {entryMode === 'existing' ? (
                <Form.Item label={t('inviteReviewersDialog.selectReviewerLabel')} required>
                    {isLoadingUsers ? (
                        <Spin />
                    ) : (
                        <Select
                            mode="multiple"
                            placeholder={t('inviteReviewersDialog.selectReviewerPlaceholder')}
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
                    <Form.Item label={t('inviteReviewersDialog.manual.nameLabel')} required style={{ marginBottom: '16px' }}>
                        <Input
                            placeholder={t('inviteReviewersDialog.manual.namePlaceholder')}
                            value={manualReviewerName}
                            onChange={(e) => setManualReviewerName(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label={t('inviteReviewersDialog.manual.emailLabel')} required style={{ marginBottom: '16px' }}>
                        <Input
                            type="email"
                            placeholder={t('inviteReviewersDialog.manual.emailPlaceholder')}
                            value={manualReviewerEmail}
                            onChange={(e) => setManualReviewerEmail(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label={t('inviteReviewersDialog.manual.institutionLabel')} required>
                        {isLoadingInstitutions ? (
                            <Spin />
                        ) : (
                            <Select
                                placeholder={t('inviteReviewersDialog.manual.institutionPlaceholder')}
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
