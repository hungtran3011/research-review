import { useState } from 'react'
import { makeStyles, Input, Field, Text, Combobox, Option, Button } from '@fluentui/react-components'
import { Mail16Regular } from '@fluentui/react-icons'
import { useAuthStore } from '../../stores/authStore'
import { getWorldData } from '../../services/country.service'
import { useQuery } from '@tanstack/react-query'
import type { UserRequestDto } from '../../models'

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
    const { email } = useAuthStore()
    const { data: worldData } = useQuery({
        queryKey: ['worldData'],
        queryFn: getWorldData
    })
    const [form, setForm] = useState<UserRequestDto>({
        email: email || '',
        name: '',
        role: '',
        avatarId: '',
        institutionId: '',
        institutionName: '',
        trackId: '',
        gender: '',
        nationality: '',
        academicStatus: '',
    })

    // Additional form fields not in UserRequestDto
    const [additionalFields, setAdditionalFields] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
        researchField: '',
    })

    document.title = "Thông tin tài khoản - Research Review"

    return (
        <div className={classes.root}>
            <Text as="h1" size={500} weight={"bold"}>Nhập thông tin của bạn</Text>
            <form className={classes.form}>
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
                            onChange={(e) => setAdditionalFields({ ...additionalFields, lastName: e.target.value })}
                        />
                    </Field>
                    <Field label={"Tên"} required hint={"Tên của bạn, ví dụ A"} className={classes.formField}>
                        <Input 
                            placeholder='VD: A' 
                            value={additionalFields.firstName}
                            onChange={(e) => {
                                const firstName = e.target.value
                                setAdditionalFields({ ...additionalFields, firstName })
                                // Update full name in form
                                setForm({ ...form, name: `${additionalFields.lastName} ${firstName}`.trim() })
                            }}
                        />
                    </Field>
                </div>
                <div className={classes.row}>
                    <Field label={"Số điện thoại"} required hint={"Số điện thoại 10 số"} className={classes.formField}>
                        <Input 
                            placeholder='VD: 0123456789' 
                            value={additionalFields.phoneNumber}
                            onChange={(e) => setAdditionalFields({ ...additionalFields, phoneNumber: e.target.value })}
                        />
                    </Field>
                    <Field label={"Ngày tháng năm sinh"} required hint={"Ngày tháng năm sinh của bạn"} className={classes.formField}>
                        <Input 
                            placeholder='VD: 01/01/2000' 
                            value={additionalFields.dateOfBirth}
                            onChange={(e) => setAdditionalFields({ ...additionalFields, dateOfBirth: e.target.value })}
                        />
                    </Field>
                </div>
                <div className={classes.row}>
                    <Field label={"Giới tính"} required hint={"Giới tính của bạn"} className={classes.formField}>
                        <Combobox 
                            placeholder='Giới tính của bạn'
                            value={form.gender}
                            onOptionSelect={(_e, data) => setForm({ ...form, gender: data.optionValue || '' })}
                        >
                            <Option key="male" value="male">Nam</Option>
                            <Option key="female" value="female">Nữ</Option>
                            <Option key="other" value="other">Khác</Option>
                        </Combobox>
                    </Field>
                    <Field label={"Quốc tịch"} required hint={"Quốc tịch của bạn"} className={classes.formField}>
                        <Combobox 
                            placeholder='Quốc tịch của bạn'
                            value={form.nationality}
                            onOptionSelect={(_e, data) => setForm({ ...form, nationality: data.optionValue || '' })}
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
                            placeholder='Trường Đại học ABC'
                            value={form.institutionName || ''}
                            onOptionSelect={(_e, data) => {
                                setForm({ 
                                    ...form, 
                                    institutionId: data.optionValue || '',
                                    institutionName: data.optionText || ''
                                })
                            }}
                        >
                            <Option key="abc" value="abc">
                                Trường Đại học ABC
                            </Option>
                        </Combobox>
                    </Field>
                    <Field label={"Lĩnh vực nghiên cứu"} required hint={"Lĩnh vực nghiên cứu của bạn, ví dụ Công nghệ thông tin"} className={classes.formField}>
                        <Combobox 
                            placeholder='Công nghệ thông tin' 
                            value={additionalFields.researchField}
                            onOptionSelect={(_e, data) => setAdditionalFields({ ...additionalFields, researchField: data.optionValue || '' })}
                        >
                            <Option key="cntt" value="cntt">
                                Công nghệ thông tin
                            </Option>
                        </Combobox>
                    </Field>
                </div>
                <div className={classes.row}>
                    <Field label={"Học hàm, học vị"} required hint={"Học hàm, học vị của bạn"} className={classes.formField}>
                        <Combobox 
                            placeholder='Học hàm, học vị của bạn'
                            value={form.academicStatus}
                            onOptionSelect={(_e, data) => setForm({ ...form, academicStatus: data.optionValue || '' })}
                        >
                            <Option key="gsts" value="gsts">Giáo sư - Tiến sĩ</Option>
                            <Option key="pgsts" value="pgsts">Phó giáo sư - Tiến sĩ</Option>
                            <Option key="ts" value="ts">Tiến sĩ</Option>
                            <Option key="ms" value="ms">Thạc sĩ</Option>
                            <Option key="bs" value="bs">Cử nhân</Option>
                        </Combobox>
                    </Field>
                </div>

                <div style={{ display: "flex" }}>
                    <Button appearance="primary" type="submit" className={classes.submitButton}>Hoàn tất đăng ký</Button>
                </div>
            </form>
        </div>
    )
}

export default Info