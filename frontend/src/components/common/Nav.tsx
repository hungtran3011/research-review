import { Avatar, Button, Dropdown, Layout, Space, Switch, Typography, Drawer, Grid, theme as antdTheme } from 'antd'
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
import { useTranslation } from 'react-i18next'
import { setAppLocale } from '../../i18n'

const { Header } = Layout
const { Text } = Typography

function Nav() {
  const screens = Grid.useBreakpoint()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const { t, i18n } = useTranslation('common')
  const { token } = antdTheme.useToken()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const email = useAuthStore((state) => state.email)
  const navigate = useNavigate()
  const { mutate: signOut } = useSignOut()
  const { data: currentUserResponse } = useCurrentUser(Boolean(isAuthenticated))

  const isAdmin = currentUserResponse?.data?.globalRole === 'ADMIN'
  const canSubmitArticle = isAuthenticated && !isAdmin
  const currentLocale = i18n.language.toLowerCase().startsWith('vi') ? 'vi' : 'en'

  const links = [
    { to: '/', label: t('nav.home'), icon: <HomeOutlined /> },
    { to: '/help', label: t('nav.help'), icon: <FileTextOutlined /> },
    ...(canSubmitArticle
      ? [
        { to: '/conferences/register', label: t('nav.registerConference'), icon: <PlusOutlined /> },
        { to: '/articles/submit', label: t('nav.submitArticle'), icon: <PlusOutlined /> },
      ]
      : []),
    ...(isAuthenticated ? [{ to: '/profile', label: t('nav.myProfile'), icon: <UserOutlined /> }] : []),
    ...(isAdmin ? [{ to: '/admin', label: t('nav.admin'), icon: <SettingOutlined /> }] : []),
  ]

  const profileMenuItems = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: t('nav.profile'),
        onClick: () => navigate('/profile'),
      },
      {
        key: 'signout',
        icon: <LogoutOutlined />,
        label: t('nav.signOut'),
        onClick: () => signOut(),
      },
    ],
    [navigate, signOut, t],
  )

  return (
    <Header
      style={{
        background: token.colorBgElevated,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
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
        <NavLink to="/">
          <Text strong style={{ margin: 0 }}>
            Research Review
          </Text>
        </NavLink>
      </Space>

      {screens.lg ? (
        <Space size={4} wrap>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? token.colorPrimary : 'inherit',
                padding: '4px 10px',
                borderRadius: 8,
                border: isActive ? `1px solid ${token.colorPrimaryBorder}` : '1px solid transparent',
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
            {t('nav.signInSignUp')}
          </Button>
        )}

        <Space size={4}>
          <Button
            size="small"
            type={currentLocale === 'vi' ? 'primary' : 'default'}
            onClick={() => void setAppLocale('vi')}
          >
            {t('lang.vi')}
          </Button>
          <Button
            size="small"
            type={currentLocale === 'en' ? 'primary' : 'default'}
            onClick={() => void setAppLocale('en')}
          >
            {t('lang.en')}
          </Button>
        </Space>

        <Space size={4}>
          {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          <Switch checked={theme === 'dark'} onChange={toggleTheme} />
        </Space>
      </Space>

      <Drawer
        title={t('nav.menu')}
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
                color: isActive ? token.colorPrimary : 'inherit',
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
