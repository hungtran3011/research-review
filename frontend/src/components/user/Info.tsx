import { useState } from 'react'
import { makeStyles, Input, Field, Text, Combobox, Option, Button } from '@fluentui/react-components'
import { Mail16Regular } from '@fluentui/react-icons'
import { useAuthStore } from '../../stores/authStore'
import { getWorldData } from '../../services/country.service'
import { useQuery } from '@tanstack/react-query'
import type { UserRequestDto } from '../../models'
import { useCompleteUserInfo } from '../../hooks/useUser'
import { Gender, GenderMap, AcademicStatus, Role } from '../../constants'
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack'

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
        padding: '0 16px',
    },

    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
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
    }
})

function Info() {
    const classes = useStyles()
    const { email, inviteToken } = useAuthStore()
    const { data: worldData } = useQuery({
        queryKey: ['worldData'],
        queryFn: getWorldData
    })
    const { data: institutionsResponse, isLoading: institutionsLoading } = useInstitutions()
    const { data: tracksResponse, isLoading: tracksLoading } = useTracks()
    const completeUserInfo = useCompleteUserInfo()
    
    const institutions = institutionsResponse?.data?.content || []
    const tracks = tracksResponse?.data || []
    
    const [form, setForm] = useState<UserRequestDto>({
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        completeUserInfo.mutate(form)
    }

    const handleFirstNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, firstName: value })
        setForm({ ...form, name: `${additionalFields.lastName} ${value}`.trim() })
    }

    const handleLastNameChange = (value: string) => {
        setAdditionalFields({ ...additionalFields, lastName: value })
        setForm({ ...form, name: `${value} ${additionalFields.firstName}`.trim() })
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
        <div className={classes.root}>
            <Text as="h1" size={500} weight={"bold"}>Nhập thông tin của bạn</Text>
            <form className={classes.form} onSubmit={handleSubmit}>
                <Field label={"Email"} required hint={"Email đã đăng ký, không thay đổi"} className={classes.formField}>
                    <Input 
                        contentBefore={<Mail16Regular />} 
                        placeholder='email@example.com' 
                        disabled 
                        value={email || form.email} 
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
                    <Field label={"Số điện thoại"} required hint={"Số điện thoại 10 số"} className={classes.formField}>
                        <Input 
                            placeholder='VD: 0123456789' 
                            value={additionalFields.phoneNumber}
                            onChange={(e) => setAdditionalFields({ ...additionalFields, phoneNumber: e.target.value })}
                            type='tel'
                        />
                    </Field>
                    <Field label={"Ngày tháng năm sinh"} required hint={"Ngày tháng năm sinh của bạn"} className={classes.formField}>
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
                            value={form.role === Role.REVIEWER ? 'Người đánh giá' : form.role === Role.RESEARCHER ? 'Nhà nghiên cứu' : form.role === Role.ADMIN ? 'Quản trị viên' : 'Người dùng'}
                            onOptionSelect={(_e, data) => setForm({ ...form, role: data.optionValue || Role.USER })}
                            required
                            disabled={!!inviteToken}
                        >
                            <Option value={Role.USER}>Người dùng</Option>
                            <Option value={Role.RESEARCHER}>Nhà nghiên cứu</Option>
                            <Option value={Role.REVIEWER}>Người đánh giá</Option>
                        </Combobox>
                    </Field>
                    <Field label={"Giới tính"} required hint={"Giới tính của bạn"} className={classes.formField}>
                        <Combobox
                            placeholder='Giới tính của bạn'
                            value={form.gender ? GenderMap[form.gender as keyof typeof GenderMap] : ''}
                            onOptionSelect={(_e, data) => setForm({ ...form, gender: data.optionValue || '' })}
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
                            value={form.nationality ? worldData?.find(c => c.alpha2 === form.nationality)?.name || '' : ''}
                            onOptionSelect={(_e, data) => setForm({ ...form, nationality: data.optionValue || '' })}
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
                <div className={classes.row}>
                    <Field label={"Nơi công tác"} required hint={"Nơi công tác của bạn, ví dụ Trường Đại học ABC"} className={classes.formField}>
                        <Combobox 
                            placeholder={institutionsLoading ? 'Đang tải...' : 'Chọn nơi công tác'}
                            value={form.institutionId ? institutions.find(i => i.id === form.institutionId)?.name || '' : ''}
                            onOptionSelect={(_e, data) => {
                                const selectedInstitution = institutions.find(i => i.id === data.optionValue)
                                setForm({ 
                                    ...form, 
                                    institutionId: data.optionValue || '',
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
                            value={form.trackId ? tracks.find(t => t.id === form.trackId)?.name || '' : ''}
                            onOptionSelect={(_e, data) => setForm({ ...form, trackId: data.optionValue || '' })}
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
                <div className={classes.row}>
                    <Field label={"Học hàm, học vị"} required hint={"Học hàm, học vị của bạn"} className={classes.formField}>
                        <Combobox 
                            placeholder='Học hàm, học vị của bạn'
                            value={form.academicStatus ? academicStatusOptions.find(option => option.value === form.academicStatus)?.label || '' : ''}
                            onOptionSelect={(_e, data) => setForm({ ...form, academicStatus: data.optionValue || '' })}
                            required
                        >
                            {academicStatusOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Combobox>
                    </Field>
                </div>

                <div style={{ display: "flex" }}>
                    <Button 
                        appearance="primary" 
                        type="submit" 
                        className={classes.submitButton}
                        disabled={completeUserInfo.isPending}
                    >
                        {completeUserInfo.isPending ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default Info