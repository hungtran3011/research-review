import { Card, Layout, Menu, Space, Typography, theme as antdTheme } from 'antd'
import { TeamOutlined, ClusterOutlined, BankOutlined, CalendarOutlined, TagsOutlined } from '@ant-design/icons'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

const { Content, Sider } = Layout
const { Title } = Typography

const AdminLayout = () => {
  const { t } = useTranslation('common')
  const { token } = antdTheme.useToken()
  const location = useLocation()
  const navigate = useNavigate()
  const shouldRedirectToUsers = location.pathname === '/admin' || location.pathname === '/admin/'

  const items = [
    { key: '/admin/users', icon: <TeamOutlined />, label: t('userManagement.title') },
    { key: '/admin/conferences', icon: <CalendarOutlined />, label: t('conferenceManagement.title') },
    { key: '/admin/tracks', icon: <ClusterOutlined />, label: t('trackManagement.title') },
    { key: '/admin/topics', icon: <TagsOutlined />, label: t('topicManagement.title') },
    { key: '/admin/institutions', icon: <BankOutlined />, label: t('institutionManagement.title') },
  ]

  useEffect(() => {
    const sectionTitle =
      location.pathname === '/admin/users'
        ? t('userManagement.title')
        : location.pathname === '/admin/conferences'
          ? t('conferenceManagement.title')
          : location.pathname === '/admin/tracks'
            ? t('trackManagement.title')
            : location.pathname === '/admin/topics'
              ? t('topicManagement.title')
              : location.pathname === '/admin/institutions'
                ? t('institutionManagement.title')
                : t('nav.admin')
    document.title = `${sectionTitle} - Research Review`
  }, [location.pathname, t])

  if (shouldRedirectToUsers) {
    return <Navigate to='/admin/users' replace />
  }

  return (
    <Content style={{ padding: 16, background: token.colorBgLayout, minHeight: 'calc(100vh - 64px)' }}>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Title level={2} style={{ margin: 0, color: token.colorText }}>
          {t('nav.admin')}
        </Title>

        <Layout style={{ background: token.colorBgLayout }}>
          <Sider width={260} style={{ background: token.colorBgLayout }}>
            <Card bodyStyle={{ padding: 12 }} style={{ background: token.colorBgContainer, borderColor: token.colorBorderSecondary }}>
              <Menu
                mode='inline'
                selectedKeys={[location.pathname]}
                items={items}
                onClick={({ key }) => navigate(key)}
              />
            </Card>
          </Sider>

          <Content style={{ paddingLeft: 16 }}>
            <Outlet />
          </Content>
        </Layout>
      </Space>
    </Content>
  )
}

export default AdminLayout
