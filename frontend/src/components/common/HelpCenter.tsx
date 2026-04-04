import React, { useEffect } from 'react'
import { Card, Typography, Button, Space, theme as antdTheme } from 'antd'
import { MailOutlined, FileTextOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Title, Text, Paragraph } = Typography

const containerStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 64px)',
  padding: 32,
  display: 'flex',
  justifyContent: 'center',
}

const innerStyle: React.CSSProperties = {
  maxWidth: 720,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const sectionBodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

function HelpCenter() {
  const { t } = useTranslation('common')
  const { token } = antdTheme.useToken()

  useEffect(() => {
    document.title = `${t('nav.help')} - Research Review`
  }, [t])

  return (
    <div style={{ ...containerStyle, background: token.colorBgLayout }}>
      <div style={innerStyle}>
        <Card>
          <Title level={4}>Trung tâm trợ giúp</Title>
          <Paragraph>
            <Text>Nhận hỗ trợ cho việc nộp bài, phản biện và quản lý tài khoản.</Text>
          </Paragraph>
          <div style={sectionBodyStyle}>
            <Paragraph type="secondary">
              Chúng tôi đang xây dựng kho tài liệu hướng dẫn chi tiết cho từng vai trò. Trong thời gian này,
              bạn có thể liên hệ trực tiếp với ban tổ chức hoặc xem lại các câu hỏi thường gặp dưới đây.
            </Paragraph>
          </div>
        </Card>

        <Card>
          <Title level={5}>Liên hệ nhanh</Title>
          <Paragraph type="secondary">Đội ngũ hỗ trợ sẽ phản hồi trong vòng 1 ngày làm việc.</Paragraph>
          <div style={sectionBodyStyle}>
            <Button type="primary" icon={<MailOutlined />} href="mailto:support@researchreview.com">
              support@researchreview.com
            </Button>
          </div>
        </Card>

        <Card>
          <Title level={5}>Tài nguyên</Title>
          <Paragraph type="secondary">Đang cập nhật thêm hướng dẫn chi tiết.</Paragraph>
          <Space direction="vertical">
            <Button icon={<FileTextOutlined />}>Quy trình nộp bài (sắp ra mắt)</Button>
            <Button icon={<FileTextOutlined />}>Quy trình phản biện (sắp ra mắt)</Button>
          </Space>
        </Card>
      </div>
    </div>
  )
}

export default HelpCenter
