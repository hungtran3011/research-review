import { Card, Layout, Menu, Space, Typography } from 'antd'
import { TeamOutlined, ClusterOutlined, BankOutlined, CalendarOutlined, TagsOutlined } from '@ant-design/icons'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'

const { Content, Sider } = Layout
const { Title } = Typography

const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to='/admin/users' replace />
  }

  const items = [
    { key: '/admin/users', icon: <TeamOutlined />, label: 'Người dùng' },
    { key: '/admin/conferences', icon: <CalendarOutlined />, label: 'Hội nghị' },
    { key: '/admin/tracks', icon: <ClusterOutlined />, label: 'Track' },
    { key: '/admin/topics', icon: <TagsOutlined />, label: 'Chủ đề' },
    { key: '/admin/institutions', icon: <BankOutlined />, label: 'Nơi công tác' },
  ]

  return (
    <Content style={{ padding: 16 }}>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản trị
        </Title>

        <Layout style={{ background: 'transparent' }}>
          <Sider width={260} theme='light' style={{ background: 'transparent' }}>
            <Card bodyStyle={{ padding: 12 }}>
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
