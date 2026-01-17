import { useState, useEffect } from 'react'
import { makeStyles, Input, Field, Text, Combobox, Option, Button, Spinner } from '@fluentui/react-components'
import { Mail16Regular } from '@fluentui/react-icons'
import { useAuthStore } from '../../stores/authStore'
import { getWorldData } from '../../services/country.service'
import { useQuery } from '@tanstack/react-query'
import type { UserRequestDto } from '../../models'
import { useCurrentUser, useUpdateUser } from '../../hooks/useUser'
import { Gender, AcademicStatus, Role, RoleOptions, type RoleType } from '../../constants'
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack'
import { Navigate } from 'react-router'

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        gap: '32px',
        height: '100%',
        flexGrow: 1,
        alignSelf: 'center',
        padding: '32px 16px',
        maxWidth: '800px',
        margin: '0 auto',
    },

    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
    },

    formField: {
        flexGrow: 1,
    },

    row: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },

    successText: {
        color: 'var(--colorPaletteGreenForeground1)',
    },

    errorText: {
        color: 'var(--colorPaletteRedForeground1)',
    },

    submitButton: {
        margin: "auto"
    },

    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    }
})

function Profile() {
    const classes = useStyles()
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
    
    const [form, setForm] = useState<UserRequestDto>({
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

    const roleLabel = roleOptions.find(({ value }) => value === form.role)?.label || ''
    const genderLabel = (() => {
        if (!form.gender) return ''
        switch (form.gender) {
            case Gender.MALE: return 'Nam'
            case Gender.FEMALE: return 'Nữ'
            case Gender.OTHER: return 'Khác'
            default: return ''
        }
    })()
    const nationalityLabel = form.nationality ? worldData?.find(c => c.alpha2 === form.nationality)?.name || '' : ''
    const institutionLabel = form.institutionId ? institutions.find(i => i.id === form.institutionId)?.name || '' : ''
    const trackLabel = form.trackId ? tracks.find(t => t.id === form.trackId)?.name || '' : ''
    const academicStatusLabel = (() => {
        switch (form.academicStatus) {
            case AcademicStatus.GSTS: return 'Giáo sư - Tiến sĩ'
            case AcademicStatus.PGSTS: return 'Phó giáo sư - Tiến sĩ'
            case AcademicStatus.TS: return 'Tiến sĩ'
            case AcademicStatus.THS: return 'Thạc sĩ'
            case AcademicStatus.CN: return 'Cử nhân'
            default: return ''
        }
    })()

    // Additional form fields not in UserRequestDto
    const [additionalFields, setAdditionalFields] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
    })

    // Populate form with current user data
    useEffect(() => {
        if (currentUser) {
            const nameParts = currentUser.name.split(' ')
            const firstName = nameParts.pop() || ''
            const lastName = nameParts.join(' ')

            const primaryRole = (currentUser.roles && currentUser.roles[0]) || currentUser.role

            setForm({
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
                phoneNumber: '', // Add if available in UserDto
                dateOfBirth: '', // Add if available in UserDto
            })
        }
    }, [currentUser])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (currentUser?.id) {
            updateUser.mutate({ id: currentUser.id, data: form })
        }
    }

    const handleFirstNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, firstName: value })
        setForm({ ...form, name: `${additionalFields.lastName} ${value}`.trim() })
    }

    const handleLastNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, lastName: value })
        setForm({ ...form, name: `${value} ${additionalFields.firstName}`.trim() })
    }

    document.title = "Thông tin cá nhân - Research Review"

    // Redirect if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/sign-in" replace />
    }

    // Loading state
    if (userLoading) {
        return (
            <div className={classes.root}>
                <div className={classes.loadingContainer}>
                    <Spinner size="large" label="Đang tải thông tin..." />
                </div>
            </div>
        )
    }

    return (
        <div className={classes.root}>
            <Text as="h1" size={500} weight={"bold"}>Thông tin cá nhân</Text>
            
            {updateUser.isSuccess && (
                <Text className={classes.successText}>Cập nhật thông tin thành công!</Text>
            )}
            {updateUser.isError && (
                <Text className={classes.errorText}>Có lỗi xảy ra khi cập nhật thông tin</Text>
            )}

            <form className={classes.form} onSubmit={handleSubmit}>
                <Field label={"Email"} required hint={"Email đã đăng ký, không thay đổi"} className={classes.formField}>
                    <Input 
                        contentBefore={<Mail16Regular />} 
                        placeholder='email@example.com' 
                        disabled 
                        value={form.email} 
                    />
                </Field>
                <div className={classes.row}>
                    <Field label={"Họ"} required hint={"Họ và tên đệm, ví dụ Nguyễn Văn"} className={classes.formField}>
                        <Input 
                            placeholder='VD: Nguyễn Văn' 
                            value={additionalFields.lastName}
                            onChange={(e) => handleLastNameChange(e.target.value)}
                            required
                        />
                    </Field>
                    <Field label={"Tên"} required hint={"Tên của bạn, ví dụ A"} className={classes.formField}>
                        <Input 
                            placeholder='VD: A' 
                            value={additionalFields.firstName}
                            onChange={(e) => handleFirstNameChange(e.target.value)}
                            required
                        />
                    </Field>
                </div>
                <div className={classes.row}>
                    <Field label={"Số điện thoại"} hint={"Số điện thoại 10 số"} className={classes.formField}>
                        <Input 
                            placeholder='VD: 0123456789' 
                            value={additionalFields.phoneNumber}
                            onChange={(e) => setAdditionalFields({ ...additionalFields, phoneNumber: e.target.value })}
                            type='tel'
                        />
                    </Field>
                    <Field label={"Ngày tháng năm sinh"} hint={"Ngày tháng năm sinh của bạn"} className={classes.formField}>
                        <Input 
                            placeholder='VD: 01/01/2000' 
                            value={additionalFields.dateOfBirth}
                            onChange={(e) => setAdditionalFields({ ...additionalFields, dateOfBirth: e.target.value })}
                            type='date'
                        />
                    </Field>
                </div>
                <div className={classes.row}>
                    <Field label={"Loại tài khoản"} required hint={"Chọn loại tài khoản của bạn"} className={classes.formField}>
                        <Combobox
                            placeholder='Loại tài khoản'
                            selectedOptions={form.role ? [form.role] : []}
                            value={roleLabel}
                            freeform={false}
                            onOptionSelect={(_e, data) => setForm({ ...form, role: (data.optionValue as RoleType) || Role.USER })}
                            required
                            disabled={!isAdmin}
                        >
                            {roleOptions.map(({ value, label }) => (
                                <Option key={value} value={value}>
                                    {label}
                                </Option>
                            ))}
                        </Combobox>
                    </Field>
                    <Field label={"Giới tính"} required hint={"Giới tính của bạn"} className={classes.formField}>
                        <Combobox
                            placeholder='Giới tính của bạn'
                            selectedOptions={form.gender ? [form.gender] : []}
                            value={genderLabel}
                            freeform={false}
                            onOptionSelect={(_e, data) => setForm({ ...form, gender: (data.optionValue as string) || '' })}
                            required
                        >
                            <Option value={Gender.MALE}>Nam</Option>
                            <Option value={Gender.FEMALE}>Nữ</Option>
                            <Option value={Gender.OTHER}>Khác</Option>
                        </Combobox>
                    </Field>
                    <Field label={"Quốc tịch"} required hint={"Quốc tịch của bạn"} className={classes.formField}>
                        <Combobox
                            placeholder='Quốc tịch của bạn'
                            selectedOptions={form.nationality ? [form.nationality] : []}
                            value={nationalityLabel}
                            freeform={false}
                            onOptionSelect={(_e, data) => setForm({ ...form, nationality: (data.optionValue as string) || '' })}
                            required
                        >
                            {
                                worldData?.map((data) => (
                                    <Option key={data.alpha2} value={data.alpha2}>{data.name}</Option>
                                ))
                            }
                        </Combobox>
                    </Field>
                </div>
                {!isAdmin && (
                    <div className={classes.row}>
                        <Field label={"Nơi công tác"} required hint={"Nơi công tác của bạn"} className={classes.formField}>
                            <Combobox
                                placeholder={institutionsLoading ? 'Đang tải...' : 'Chọn nơi công tác'}
                                selectedOptions={form.institutionId ? [form.institutionId] : []}
                                value={institutionLabel}
                                freeform={false}
                                onOptionSelect={(_e, data) => {
                                    const selectedInstitution = institutions.find(i => i.id === data.optionValue)
                                    setForm({
                                        ...form,
                                        institutionId: (data.optionValue as string) || '',
                                        institutionName: selectedInstitution?.name || ''
                                    })
                                }}
                                disabled={institutionsLoading}
                                required
                            >
                                {institutions.map((institution) => (
                                    <Option key={institution.id} value={institution.id}>
                                        {institution.name}
                                    </Option>
                                ))}
                            </Combobox>
                        </Field>
                        <Field label={"Lĩnh vực nghiên cứu (Track)"} required hint={"Lĩnh vực nghiên cứu của bạn"} className={classes.formField}>
                            <Combobox
                                placeholder={tracksLoading ? 'Đang tải...' : 'Chọn lĩnh vực nghiên cứu'}
                                selectedOptions={form.trackId ? [form.trackId] : []}
                                value={trackLabel}
                                freeform={false}
                                onOptionSelect={(_e, data) => setForm({ ...form, trackId: (data.optionValue as string) || '' })}
                                disabled={tracksLoading}
                                required
                            >
                                {tracks.filter(track => track.isActive).map((track) => (
                                    <Option key={track.id} value={track.id}>
                                        {track.name}
                                    </Option>
                                ))}
                            </Combobox>
                        </Field>
                    </div>
                )}
                {!isAdmin && (
                    <div className={classes.row}>
                        <Field label={"Học hàm, học vị"} required hint={"Học hàm, học vị của bạn"} className={classes.formField}>
                            <Combobox
                                placeholder='Học hàm, học vị của bạn'
                                selectedOptions={form.academicStatus ? [form.academicStatus] : []}
                                value={academicStatusLabel}
                                freeform={false}
                                onOptionSelect={(_e, data) => setForm({ ...form, academicStatus: (data.optionValue as string) || '' })}
                                required
                            >
                                <Option value={AcademicStatus.GSTS}>Giáo sư - Tiến sĩ</Option>
                                <Option value={AcademicStatus.PGSTS}>Phó giáo sư - Tiến sĩ</Option>
                                <Option value={AcademicStatus.TS}>Tiến sĩ</Option>
                                <Option value={AcademicStatus.THS}>Thạc sĩ</Option>
                                <Option value={AcademicStatus.CN}>Cử nhân</Option>
                            </Combobox>
                        </Field>
                    </div>
                )}

                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <Button 
                        appearance="primary" 
                        type="submit" 
                        className={classes.submitButton}
                        disabled={updateUser.isPending}
                    >
                        {updateUser.isPending ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default Profile
