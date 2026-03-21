import { useState } from 'react'
import { Input, Select, Button, Form, Row, Col, Typography } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'
import { getWorldData } from '../../services/country.service'
import { useQuery } from '@tanstack/react-query'
import type { UserRequestDto } from '../../models'
import { useCompleteUserInfo } from '../../hooks/useUser'
import { Gender, AcademicStatus, Role } from '../../constants'
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack'

function Info() {
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
        role: inviteToken ? 'REVIEWER' : 'USER',
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
        { value: AcademicStatus.GSTS, label: 'Giáo sư - Tiến sĩ' },
        { value: AcademicStatus.PGSTS, label: 'Phó giáo sư - Tiến sĩ' },
        { value: AcademicStatus.TS, label: 'Tiến sĩ' },
        { value: AcademicStatus.THS, label: 'Thạc sĩ' },
        { value: AcademicStatus.CN, label: 'Cử nhân' },
    ]

    document.title = "Thông tin tài khoản - Research Review"

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
        }}>
            <Typography.Title level={1}>Nhập thông tin của bạn</Typography.Title>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                style={{ width: '100%' }}
            >
                <Form.Item label="Email" required>
                    <Input 
                        prefix={<MailOutlined />}
                        placeholder='email@example.com' 
                        disabled 
                        value={email || formData.email} 
                    />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Họ" required>
                            <Input 
                                placeholder='Họ và tên đệm, ví dụ Nguyễn Văn' 
                                value={additionalFields.lastName}
                                onChange={(e) => handleLastNameChange(e.target.value)}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Tên" required>
                            <Input 
                                placeholder='Tên của bạn, ví dụ A' 
                                value={additionalFields.firstName}
                                onChange={(e) => handleFirstNameChange(e.target.value)}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Số điện thoại" required>
                            <Input 
                                placeholder='Số điện thoại 10 số' 
                                value={additionalFields.phoneNumber}
                                onChange={(e) => setAdditionalFields({ ...additionalFields, phoneNumber: e.target.value })}
                                type='tel'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Ngày tháng năm sinh" required>
                            <Input 
                                placeholder='Ngày tháng năm sinh' 
                                value={additionalFields.dateOfBirth}
                                onChange={(e) => setAdditionalFields({ ...additionalFields, dateOfBirth: e.target.value })}
                                type='date'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Loại tài khoản" required>
                            <Select
                                placeholder='Chọn loại tài khoản'
                                value={formData.role || undefined}
                                onChange={(val) => setFormData({ ...formData, role: val })}
                                disabled={!!inviteToken}
                                options={[
                                    { label: 'Người dùng', value: Role.USER },
                                    { label: 'Nhà nghiên cứu', value: 'RESEARCHER' },
                                    { label: 'Người đánh giá', value: Role.REVIEWER },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Giới tính" required>
                            <Select
                                placeholder='Chọn giới tính'
                                value={formData.gender || undefined}
                                onChange={(val) => setFormData({ ...formData, gender: val })}
                                options={[
                                    { label: 'Nam', value: Gender.MALE },
                                    { label: 'Nữ', value: Gender.FEMALE },
                                    { label: 'Khác', value: Gender.OTHER },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Quốc tịch" required>
                            <Select
                                placeholder='Chọn quốc tịch'
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
                        <Form.Item label="Nơi công tác" required>
                            <Select 
                                placeholder={institutionsLoading ? 'Đang tải...' : 'Chọn nơi công tác'}
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
                        <Form.Item label="Lĩnh vực nghiên cứu (Track)" required>
                            <Select 
                                placeholder={tracksLoading ? 'Đang tải...' : 'Chọn lĩnh vực'}
                                value={formData.trackId || undefined}
                                onChange={(val) => setFormData({ ...formData, trackId: val })}
                                disabled={tracksLoading}
                                options={tracks.filter(t => t.isActive).map((t) => ({ label: t.name, value: t.id }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label="Học hàm, học vị" required>
                    <Select 
                        placeholder='Chọn học hàm, học vị'
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
                        {completeUserInfo.isPending ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}

export default Info