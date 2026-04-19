import { useState, useEffect } from 'react'
import { Input, Button, Form, Select, Spin, Typography, Row, Col, DatePicker, theme as antdTheme } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'
import { getWorldData } from '../../services/country.service'
import { useQuery } from '@tanstack/react-query'
import type { UserRequestDto } from '../../models'
import { useCurrentUser, useUpdateUser } from '../../hooks/useUser'
import { Gender, AcademicStatus, Role } from '../../constants'
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack'
import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const styles = {
    page: {
        width: '100%',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 16px',
    },
    root: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        gap: '32px',
        width: '100%',
        flexGrow: 1,
        maxWidth: '800px',
    },
    submitButton: {
        margin: 'auto',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '16px',
    },
}

function Profile() {
    const { t } = useTranslation('common')
    const { token } = antdTheme.useToken()
    const [form] = Form.useForm()
    const { email, isAuthenticated } = useAuthStore()
    const { data: worldData } = useQuery({
        queryKey: ['worldData'],
        queryFn: getWorldData
    })
    const { data: currentUserResponse, isLoading: userLoading } = useCurrentUser(Boolean(isAuthenticated))
    const { data: institutionsResponse, isLoading: institutionsLoading } = useInstitutions()
    const { data: tracksResponse, isLoading: tracksLoading } = useTracks()
    const updateUser = useUpdateUser()
    
    const institutions = institutionsResponse?.data?.content || []
    const tracks = tracksResponse?.data || []
    const currentUser = currentUserResponse?.data

    const effectiveRoles = [currentUser?.globalRole].filter(Boolean)
    const isAdmin = effectiveRoles.includes(Role.ADMIN)

    const [formData, setFormData] = useState<UserRequestDto>({
        email: email || '',
        name: '',
        role: Role.USER,
        avatarId: '',
        institutionId: '',
        institutionName: '',
        trackId: '',
        gender: '',
        nationality: '',
        academicStatus: '',
    })

    const [additionalFields, setAdditionalFields] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
    })

    useEffect(() => {
        if (currentUser) {
            const nameParts = currentUser.name.split(' ')
            const firstName = nameParts.pop() || ''
            const lastName = nameParts.join(' ')

            setFormData({
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.globalRole || Role.USER,
                avatarId: currentUser.avatarId || '',
                institutionId: currentUser.institution?.id || '',
                institutionName: currentUser.institution?.name || '',
                trackId: currentUser.track?.id || '',
                gender: currentUser.gender || '',
                nationality: currentUser.nationality || '',
                academicStatus: currentUser.academicStatus || '',
            })

            setAdditionalFields({
                firstName,
                lastName,
                phoneNumber: '',
                dateOfBirth: '',
            })
        }
    }, [currentUser])

    const handleSubmit = () => {
        if (currentUser?.id) {
            const safeRole = currentUser.globalRole || Role.USER
            updateUser.mutate({
                id: currentUser.id,
                data: {
                    ...formData,
                    role: safeRole,
                }
            })
        }
    }

    const handleFirstNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, firstName: value })
        setFormData({ ...formData, name: `${additionalFields.lastName} ${value}`.trim() })
    }

    const handleLastNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, lastName: value })
        setFormData({ ...formData, name: `${value} ${additionalFields.firstName}`.trim() })
    }

    document.title = `${t('profile.pageTitle')} - Research Review`

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />
    }

    if (userLoading) {
        return (
            <div style={{ ...styles.page, backgroundColor: token.colorBgLayout, color: token.colorText }}>
                <div style={styles.root}>
                    <div style={styles.loadingContainer}>
                        <Spin size="large" tip={t('profile.common.loading')} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ ...styles.page, backgroundColor: token.colorBgLayout, color: token.colorText }}>
            <div style={styles.root}>
                <Title level={1}>{t('profile.title')}</Title>
            
                {updateUser.isSuccess && (
                    <Text type='success'>{t('profile.updateSuccess')}</Text>
                )}
                {updateUser.isError && (
                    <Text type='danger'>{t('profile.updateError')}</Text>
                )}

                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ width: '100%' }}>
                    <Form.Item label={t('profile.fields.email.label')} required>
                        <Input 
                            prefix={<MailOutlined />}
                            placeholder={t('profile.fields.email.placeholder')} 
                            disabled 
                            value={formData.email} 
                        />
                    </Form.Item>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label={t('profile.fields.lastName.label')} required tooltip={t('profile.fields.lastName.tooltip')}>
                            <Input 
                                placeholder={t('profile.fields.lastName.placeholder')} 
                                value={additionalFields.lastName}
                                onChange={(e) => handleLastNameChange(e.target.value)}
                                required
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label={t('profile.fields.firstName.label')} required tooltip={t('profile.fields.firstName.tooltip')}>
                            <Input 
                                placeholder={t('profile.fields.firstName.placeholder')} 
                                value={additionalFields.firstName}
                                onChange={(e) => handleFirstNameChange(e.target.value)}
                                required
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label={t('profile.fields.phone.label')} tooltip={t('profile.fields.phone.tooltip')}>
                            <Input 
                                placeholder={t('profile.fields.phone.placeholder')} 
                                value={additionalFields.phoneNumber}
                                onChange={(e) => setAdditionalFields({ ...additionalFields, phoneNumber: e.target.value })}
                                type='tel'
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label={t('profile.fields.dateOfBirth.label')} tooltip={t('profile.fields.dateOfBirth.tooltip')}>
                            <DatePicker
                                placeholder={t('profile.fields.dateOfBirth.placeholder')} 
                                value={additionalFields.dateOfBirth ? dayjs(additionalFields.dateOfBirth) : null}
                                onChange={(value) =>
                                    setAdditionalFields({
                                        ...additionalFields,
                                        dateOfBirth: value ? value.format('YYYY-MM-DD') : ''
                                    })
                                }
                                format="YYYY-MM-DD"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label={t('profile.fields.gender.label')} required tooltip={t('profile.fields.gender.tooltip')}>
                            <Select
                                placeholder={t('profile.fields.gender.placeholder')}
                                value={formData.gender || undefined}
                                onChange={(value) => setFormData({ ...formData, gender: value })}
                                options={[
                                    { value: Gender.MALE, label: t('profile.genderOptions.male') },
                                    { value: Gender.FEMALE, label: t('profile.genderOptions.female') },
                                    { value: Gender.OTHER, label: t('profile.genderOptions.other') },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label={t('profile.fields.nationality.label')} required tooltip={t('profile.fields.nationality.tooltip')}>
                            <Select
                                placeholder={t('profile.fields.nationality.placeholder')}
                                value={formData.nationality || undefined}
                                onChange={(value) => setFormData({ ...formData, nationality: value })}
                                options={worldData?.map((data) => ({
                                    value: data.alpha2,
                                    label: data.name
                                })) || []}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                {!isAdmin && (
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item label={t('profile.fields.institution.label')} required tooltip={t('profile.fields.institution.tooltip')}>
                                <Select
                                    placeholder={institutionsLoading ? t('profile.common.loading') : t('profile.fields.institution.placeholder')}
                                    value={formData.institutionId || undefined}
                                    onChange={(value) => {
                                        const selectedInstitution = institutions.find(i => i.id === value)
                                        setFormData({
                                            ...formData,
                                            institutionId: value,
                                            institutionName: selectedInstitution?.name || ''
                                        })
                                    }}
                                    loading={institutionsLoading}
                                    disabled={institutionsLoading}
                                    options={institutions.map((institution) => ({
                                        value: institution.id,
                                        label: institution.name
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label={t('profile.fields.track.label')} required tooltip={t('profile.fields.track.tooltip')}>
                                <Select
                                    placeholder={tracksLoading ? t('profile.common.loading') : t('profile.fields.track.placeholder')}
                                    value={formData.trackId || undefined}
                                    onChange={(value) => setFormData({ ...formData, trackId: value })}
                                    loading={tracksLoading}
                                    disabled={tracksLoading}
                                    options={tracks.filter(track => track.isActive).map((track) => ({
                                        value: track.id,
                                        label: track.name
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )}
                {!isAdmin && (
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item label={t('profile.fields.academicStatus.label')} required tooltip={t('profile.fields.academicStatus.tooltip')}>
                                <Select
                                    placeholder={t('profile.fields.academicStatus.placeholder')}
                                    value={formData.academicStatus || undefined}
                                    onChange={(value) => setFormData({ ...formData, academicStatus: value })}
                                    options={[
                                        { value: AcademicStatus.GSTS, label: t('profile.academicStatusOptions.gsts') },
                                        { value: AcademicStatus.PGSTS, label: t('profile.academicStatusOptions.pgsts') },
                                        { value: AcademicStatus.TS, label: t('profile.academicStatusOptions.ts') },
                                        { value: AcademicStatus.THS, label: t('profile.academicStatusOptions.ths') },
                                        { value: AcademicStatus.CN, label: t('profile.academicStatusOptions.cn') },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: '24px' }}>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            style={styles.submitButton}
                            loading={updateUser.isPending}
                        >
                            {updateUser.isPending ? t('profile.actions.updating') : t('profile.actions.update')}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}

export default Profile
