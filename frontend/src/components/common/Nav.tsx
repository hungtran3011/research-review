import React from 'react';
import { makeStyles, Switch, Button, Avatar, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from '@fluentui/react-components';
import { tokens } from '@fluentui/react-components';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useSignOut } from '../../hooks/useAuth';
import { useCurrentUser } from '../../hooks/useUser';
import { NavLink, useNavigate } from 'react-router';
import { NotificationCenter } from './NotificationCenter';
import {
  WeatherSunny16Regular,
  WeatherSunny16Filled,
  WeatherMoon16Regular,
  WeatherMoon16Filled,
  Home12Regular,
  SignOut20Regular,
  Person20Regular,
  Add16Regular,
  Document16Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  nav: {
    width: '100%',
    height: '60px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 16px',
    boxShadow: tokens.shadow4,
  },
  navTitle: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  navLinks: {
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    ":hover": {
      borderBottom: `2px solid ${tokens.colorBrandForeground1}`,
    }
  },
  activeLink: {
    textDecoration: 'none',
    borderBottom: `2px solid ${tokens.colorBrandForeground1}`,
    color: tokens.colorBrandForeground1,
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navActions: {
    marginLeft: '16px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  themeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }
});

function Nav() {
  const classes = useStyles();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const email = useAuthStore((state) => state.email);
  const navigate = useNavigate();
  const { mutate: signOut } = useSignOut();
  const { data: currentUserResponse } = useCurrentUser(Boolean(isAuthenticated));
  const roles = currentUserResponse?.data?.roles?.length
    ? currentUserResponse.data.roles
    : currentUserResponse?.data?.role
      ? [currentUserResponse.data.role]
      : [];
  const isAdmin = roles.includes('ADMIN');
  const isResearcher = roles.includes('RESEARCHER');

  const commonLinks = [
    { to: '/', label: 'Trang chủ', icon: <Home12Regular /> },
    { to: '/help', label: 'Trợ giúp', icon: <Document16Regular /> },
  ];

  const researcherLinks = isAuthenticated && isResearcher
    ? [{ to: '/articles/submit', label: 'Nộp bài báo', icon: <Add16Regular /> }]
    : [];

  const authenticatedLinks = [
    { to: '/profile', label: 'Hồ sơ của tôi', icon: <Person20Regular /> },
  ];

  const adminLinks = isAdmin
    ? [{ to: '/admin', label: 'Quản trị', icon: <Document16Regular /> }]
    : [];

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className={classes.nav}>
      <div className={classes.navTitle}>
        <div>Logo</div>
        <div>Research Review</div>
      </div>
      <div className={classes.navLinks}>
  {[...commonLinks, ...researcherLinks, ...(isAuthenticated ? [...authenticatedLinks, ...adminLinks] : [])].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? classes.activeLink : classes.link)}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className={classes.navActions}>
        {isAuthenticated && <NotificationCenter />}
        {isAuthenticated ? (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Avatar name={email || 'User'} />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Person20Regular />} onClick={() => navigate('/profile')}>
                  Thông tin cá nhân
                </MenuItem>
                <MenuItem icon={<SignOut20Regular />} onClick={handleSignOut}>
                  Đăng xuất
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        ) : (
          <Button appearance='primary' as="a" href="/signin">
            Đăng nhập / Đăng ký
          </Button>
        )}
        <div className={classes.themeToggle}>
          {theme === "dark" ? <WeatherSunny16Regular /> : <WeatherSunny16Filled />}
          <Switch checked={theme === "dark"} onChange={toggleTheme} />
          {theme === "dark" ? <WeatherMoon16Filled /> : <WeatherMoon16Regular />}
        </div>
      </div>
    </div>
  );
}

export default Nav;