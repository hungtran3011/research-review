import React from 'react';
import { makeStyles, Switch, Button, Avatar, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from '@fluentui/react-components';
import { tokens } from '@fluentui/react-components';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useSignOut } from '../../hooks/useAuth';
import { NavLink, useLocation } from 'react-router';
import {
  WeatherSunny16Regular,
  WeatherSunny16Filled,
  WeatherMoon16Regular,
  WeatherMoon16Filled,
  Home12Regular,
  SignOut20Regular,
  Person20Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  nav: {
    width: '100vw',
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
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const email = useAuthStore((state) => state.email);
  const { mutate: signOut } = useSignOut();

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
        <NavLink to="/" className={location.pathname === "/" ? classes.activeLink : classes.link}>
          <Home12Regular /> Trang chủ
        </NavLink>
        <NavLink to="/link2" className={location.pathname === "/link2" ? classes.activeLink : classes.link}>
          <Home12Regular /> Link 2
        </NavLink>
        <NavLink to="/link3" className={location.pathname === "/link3" ? classes.activeLink : classes.link}>
          <Home12Regular /> Link 3
        </NavLink>
      </div>
      <div className={classes.navActions}>
        {isAuthenticated ? (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Avatar name={email || 'User'} />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Person20Regular />} onClick={() => window.location.href = '/info'}>
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