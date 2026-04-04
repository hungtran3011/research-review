import { useState } from 'react'
import { Input, Select, Button, Form, Row, Col, Typography, DatePicker, theme as antdTheme } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'
import { getWorldData } from '../../services/country.service'
import { useQuery } from '@tanstack/react-query'
import type { UserRequestDto } from '../../models'
import { useCompleteUserInfo } from '../../hooks/useUser'
import { Gender, AcademicStatus, Role } from '../../constants'
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

function Info() {
    const { t } = useTranslation('common')
    const { token } = antdTheme.useToken()
    const { email, inviteToken } = useAuthStore()
    const { data: worldData } = useQuery({
        queryKey: ['worldData'],
        queryFn: getWorldData
    })
    const { data: institutionsResponse, isLoading: institutionsLoading } = useInstitutions()
    const { data: tracksResponse, isLoading: tracksLoading } = useTracks()
    const completeUserInfo = useCompleteUserInfo()
    const [form] = Form.useForm()
    
    const institutions = institutionsResponse?.data?.content || []
    const tracks = tracksResponse?.data || []
    
    const [formData, setFormData] = useState<UserRequestDto>({
        email: email || '',
        name: '',
        role: inviteToken ? Role.REVIEWER : Role.USER,
        avatarId: '',
        institutionId: '',
        institutionName: '',
        trackId: '',
        gender: '',
        nationality: '',
        academicStatus: '',
        inviteToken: inviteToken,
    })

    // Additional form fields not in UserRequestDto
    const [additionalFields, setAdditionalFields] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
        researchField: '',
    })

    const handleSubmit = () => {
        completeUserInfo.mutate(formData)
    }

    const handleFirstNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, firstName: value })
        setFormData({ ...formData, name: `${additionalFields.lastName} ${value}`.trim() })
    }

    const handleLastNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, lastName: value })
        setFormData({ ...formData, name: `${value} ${additionalFields.firstName}`.trim() })
    }

    const academicStatusOptions = [
        { value: AcademicStatus.GSTS, label: t('info.academicStatusOptions.gsts') },
        { value: AcademicStatus.PGSTS, label: t('info.academicStatusOptions.pgsts') },
        { value: AcademicStatus.TS, label: t('info.academicStatusOptions.ts') },
        { value: AcademicStatus.THS, label: t('info.academicStatusOptions.ths') },
        { value: AcademicStatus.CN, label: t('info.academicStatusOptions.cn') },
    ]

    document.title = `${t('info.pageTitle')} - Research Review`

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '32px',
            height: '100%',
            flexGrow: 1,
            padding: '32px 16px',
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: token.colorBgLayout,
            color: token.colorText,
        }}>
            <Typography.Title level={1}>{t('info.title')}</Typography.Title>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                style={{ width: '100%' }}
            >
                <Form.Item label={t('info.fields.email.label')} required>
                    <Input 
                        prefix={<MailOutlined />}
                        placeholder={t('info.fields.email.placeholder')} 
                        disabled 
                        value={email || formData.email} 
                    />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.lastName.label')} required>
                            <Input 
                                placeholder={t('info.fields.lastName.placeholder')} 
                                value={additionalFields.lastName}
                                onChange={(e) => handleLastNameChange(e.target.value)}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.firstName.label')} required>
                            <Input 
                                placeholder={t('info.fields.firstName.placeholder')} 
                                value={additionalFields.firstName}
                                onChange={(e) => handleFirstNameChange(e.target.value)}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.phone.label')} required>
                            <Input 
                                placeholder={t('info.fields.phone.placeholder')} 
                                value={additionalFields.phoneNumber}
                                onChange={(e) => setAdditionalFields({ ...additionalFields, phoneNumber: e.target.value })}
                                type='tel'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.dateOfBirth.label')} required>
                            <DatePicker
                                placeholder={t('info.fields.dateOfBirth.placeholder')} 
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
                    <Col span={12}>
                        <Form.Item label={t('info.fields.role.label')} required>
                            <Select
                                placeholder={t('info.fields.role.placeholder')}
                                value={formData.role || undefined}
                                onChange={(val) => setFormData({ ...formData, role: val })}
                                disabled={!!inviteToken}
                                options={[
                                    { label: t('info.roleOptions.user'), value: Role.USER },
                                    { label: t('info.roleOptions.researcher'), value: Role.RESEARCHER },
                                    { label: t('info.roleOptions.reviewer'), value: Role.REVIEWER },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.gender.label')} required>
                            <Select
                                placeholder={t('info.fields.gender.placeholder')}
                                value={formData.gender || undefined}
                                onChange={(val) => setFormData({ ...formData, gender: val })}
                                options={[
                                    { label: t('info.genderOptions.male'), value: Gender.MALE },
                                    { label: t('info.genderOptions.female'), value: Gender.FEMALE },
                                    { label: t('info.genderOptions.other'), value: Gender.OTHER },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.nationality.label')} required>
                            <Select
                                placeholder={t('info.fields.nationality.placeholder')}
                                value={formData.nationality || undefined}
                                onChange={(val) => setFormData({ ...formData, nationality: val })}
                                options={worldData?.map((c) => ({ label: c.name, value: c.alpha2 })) || []}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.institution.label')} required>
                            <Select 
                                placeholder={institutionsLoading ? t('info.common.loading') : t('info.fields.institution.placeholder')}
                                value={formData.institutionId || undefined}
                                onChange={(val) => {
                                    const sel = institutions.find(i => i.id === val)
                                    setFormData({ 
                                        ...formData, 
                                        institutionId: val,
                                        institutionName: sel?.name || ''
                                    })
                                }}
                                disabled={institutionsLoading}
                                options={institutions.map((i) => ({ label: i.name, value: i.id }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label={t('info.fields.track.label')} required>
                            <Select 
                                placeholder={tracksLoading ? t('info.common.loading') : t('info.fields.track.placeholder')}
                                value={formData.trackId || undefined}
                                onChange={(val) => setFormData({ ...formData, trackId: val })}
                                disabled={tracksLoading}
                                options={tracks.filter(t => t.isActive).map((t) => ({ label: t.name, value: t.id }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label={t('info.fields.academicStatus.label')} required>
                    <Select 
                        placeholder={t('info.fields.academicStatus.placeholder')}
                        value={formData.academicStatus || undefined}
                        onChange={(val) => setFormData({ ...formData, academicStatus: val })}
                        options={academicStatusOptions}
                    />
                </Form.Item>

                <Form.Item style={{ textAlign: 'center' }}>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={completeUserInfo.isPending}
                    >
                        {completeUserInfo.isPending ? t('info.actions.submitting') : t('info.actions.submit')}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}

export default Info