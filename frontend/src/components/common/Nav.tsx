import { Avatar, Button, Dropdown, Layout, Space, Switch, Typography, Drawer, Grid } from 'antd'
import {
  BulbFilled,
  BulbOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { NavLink, useNavigate } from 'react-router'
import { useMemo, useState } from 'react'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'
import { useSignOut } from '../../hooks/useAuth'
import { useCurrentUser } from '../../hooks/useUser'
import { NotificationCenter } from './NotificationCenter'

const { Header } = Layout
const { Text } = Typography

function Nav() {
    const screens = Grid.useBreakpoint()
    const [drawerVisible, setDrawerVisible] = useState(false)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const email = useAuthStore((state) => state.email)
  const navigate = useNavigate()
  const { mutate: signOut } = useSignOut()
  const { data: currentUserResponse } = useCurrentUser(Boolean(isAuthenticated))

  const roles = currentUserResponse?.data?.roles?.length
    ? currentUserResponse.data.roles
    : currentUserResponse?.data?.role
      ? [currentUserResponse.data.role]
      : []

  const isAdmin = roles.includes('ADMIN')
  const isResearcher = roles.includes('RESEARCHER')

  const links = [
    { to: '/', label: 'Trang chủ', icon: <HomeOutlined /> },
    { to: '/help', label: 'Trợ giúp', icon: <FileTextOutlined /> },
    ...(isAuthenticated && isResearcher
      ? [{ to: '/articles/submit', label: 'Nộp bài báo', icon: <PlusOutlined /> }]
      : []),
    ...(isAuthenticated ? [{ to: '/profile', label: 'Hồ sơ của tôi', icon: <UserOutlined /> }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Quản trị', icon: <SettingOutlined /> }] : []),
  ]

  const profileMenuItems = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Thông tin cá nhân',
        onClick: () => navigate('/profile'),
      },
      {
        key: 'signout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        onClick: () => signOut(),
      },
    ],
    [navigate, signOut],
  )

  return (
    <Header
      style={{
        background: theme === 'dark' ? '#141414' : '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 16px',
        height: 64,
        lineHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <Space size={8} style={{ minWidth: screens.lg ? 180 : 80, alignItems: 'center' }}>
        {!screens.lg && (
          <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} />
        )}
        <Text strong style={{ margin: 0 }}>
          Research Review
        </Text>
      </Space>

      {screens.lg ? (
        <Space size={4} wrap>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? '#1677ff' : 'inherit',
                padding: '4px 10px',
                borderRadius: 8,
                border: isActive ? '1px solid #91caff' : '1px solid transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                lineHeight: '22px',
              })}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </Space>
      ) : null}

      <Space size={12} style={{ minWidth: 260, justifyContent: 'flex-end' }}>
        {isAuthenticated && <NotificationCenter />}

        {isAuthenticated ? (
          <Dropdown menu={{ items: profileMenuItems }} trigger={['click']}>
            <Avatar style={{ cursor: 'pointer' }} icon={<UserOutlined />}>
              {email?.[0]?.toUpperCase()}
            </Avatar>
          </Dropdown>
        ) : (
          <Button type='primary' href='/signin'>
            Đăng nhập / Đăng ký
          </Button>
        )}

        <Space size={4}>
          {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          <Switch checked={theme === 'dark'} onChange={toggleTheme} />
        </Space>
      </Space>

      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        zIndex={1005}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setDrawerVisible(false)}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? '#1677ff' : 'inherit',
                padding: '8px 4px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              })}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </Space>
      </Drawer>
    </Header>
  )
}

export default Nav
