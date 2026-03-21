import { useState, useEffect } from 'react'
import { Input, Button, Form, Select, Spin, Typography, Row, Col } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'
import { getWorldData } from '../../services/country.service'
import { useQuery } from '@tanstack/react-query'
import type { UserRequestDto } from '../../models'
import { useCurrentUser, useUpdateUser } from '../../hooks/useUser'
import { Gender, AcademicStatus, Role, RoleOptions, type RoleType } from '../../constants'
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack'
import { Navigate } from 'react-router'

const { Title, Text } = Typography

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        gap: '32px',
        height: '100%',
        flexGrow: 1,
        padding: '32px 16px',
        maxWidth: '800px',
        margin: '0 auto',
    },
    success: {
        color: '#52c41a',
    },
    error: {
        color: '#ff4d4f',
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

    const effectiveRoles = (currentUser?.roles?.length ? currentUser.roles : [currentUser?.role]).filter(Boolean)
    const isAdmin = effectiveRoles.includes(Role.ADMIN)
    const roleOptions = RoleOptions.filter(({ value }) => isAdmin || value !== Role.ADMIN)
    
    const [formData, setFormData] = useState<UserRequestDto>({
        email: email || '',
        name: '',
        role: 'USER',
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

            const primaryRole = (currentUser.roles && currentUser.roles[0]) || currentUser.role

            setFormData({
                email: currentUser.email,
                name: currentUser.name,
                role: (primaryRole as RoleType) || Role.USER,
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
            updateUser.mutate({ id: currentUser.id, data: formData })
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

    document.title = "Thông tin cá nhân - Research Review"

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />
    }

    if (userLoading) {
        return (
            <div style={styles.root}>
                <div style={styles.loadingContainer}>
                    <Spin size="large" tip="Đang tải thông tin..." />
                </div>
            </div>
        )
    }

    return (
        <div style={styles.root}>
            <Title level={1}>Thông tin cá nhân</Title>
            
            {updateUser.isSuccess && (
                <Text style={styles.success}>Cập nhật thông tin thành công!</Text>
            )}
            {updateUser.isError && (
                <Text style={styles.error}>Có lỗi xảy ra khi cập nhật thông tin</Text>
            )}

            <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ width: '100%' }}>
                <Form.Item label="Email" required>
                    <Input 
                        prefix={<MailOutlined />}
                        placeholder='email@example.com' 
                        disabled 
                        value={formData.email} 
                    />
                </Form.Item>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Họ" required tooltip="Họ và tên đệm, ví dụ Nguyễn Văn">
                            <Input 
                                placeholder='VD: Nguyễn Văn' 
                                value={additionalFields.lastName}
                                onChange={(e) => handleLastNameChange(e.target.value)}
                                required
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Tên" required tooltip="Tên của bạn, ví dụ A">
                            <Input 
                                placeholder='VD: A' 
                                value={additionalFields.firstName}
                                onChange={(e) => handleFirstNameChange(e.target.value)}
                                required
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Số điện thoại" tooltip="Số điện thoại 10 số">
                            <Input 
                                placeholder='VD: 0123456789' 
                                value={additionalFields.phoneNumber}
                                onChange={(e) => setAdditionalFields({ ...additionalFields, phoneNumber: e.target.value })}
                                type='tel'
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Ngày tháng năm sinh" tooltip="Ngày tháng năm sinh của bạn">
                            <Input 
                                placeholder='VD: 01/01/2000' 
                                value={additionalFields.dateOfBirth}
                                onChange={(e) => setAdditionalFields({ ...additionalFields, dateOfBirth: e.target.value })}
                                type='date'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Loại tài khoản" required tooltip="Chọn loại tài khoản của bạn">
                            <Select
                                placeholder='Loại tài khoản'
                                value={formData.role || undefined}
                                onChange={(value) => setFormData({ ...formData, role: value as RoleType })}
                                disabled={!isAdmin}
                                options={roleOptions.map(({ value, label }) => ({
                                    value,
                                    label
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Giới tính" required tooltip="Giới tính của bạn">
                            <Select
                                placeholder='Giới tính của bạn'
                                value={formData.gender || undefined}
                                onChange={(value) => setFormData({ ...formData, gender: value })}
                                options={[
                                    { value: Gender.MALE, label: 'Nam' },
                                    { value: Gender.FEMALE, label: 'Nữ' },
                                    { value: Gender.OTHER, label: 'Khác' },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Quốc tịch" required tooltip="Quốc tịch của bạn">
                            <Select
                                placeholder='Quốc tịch của bạn'
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
                            <Form.Item label="Nơi công tác" required tooltip="Nơi công tác của bạn">
                                <Select
                                    placeholder={institutionsLoading ? 'Đang tải...' : 'Chọn nơi công tác'}
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
                            <Form.Item label="Lĩnh vực nghiên cứu (Track)" required tooltip="Lĩnh vực nghiên cứu của bạn">
                                <Select
                                    placeholder={tracksLoading ? 'Đang tải...' : 'Chọn lĩnh vực nghiên cứu'}
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
                            <Form.Item label="Học hàm, học vị" required tooltip="Học hàm, học vị của bạn">
                                <Select
                                    placeholder='Học hàm, học vị của bạn'
                                    value={formData.academicStatus || undefined}
                                    onChange={(value) => setFormData({ ...formData, academicStatus: value })}
                                    options={[
                                        { value: AcademicStatus.GSTS, label: 'Giáo sư - Tiến sĩ' },
                                        { value: AcademicStatus.PGSTS, label: 'Phó giáo sư - Tiến sĩ' },
                                        { value: AcademicStatus.TS, label: 'Tiến sĩ' },
                                        { value: AcademicStatus.THS, label: 'Thạc sĩ' },
                                        { value: AcademicStatus.CN, label: 'Cử nhân' },
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
                        {updateUser.isPending ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                    </Button>
                </div>
            </Form>
        </div>
    )
}

export default Profile
