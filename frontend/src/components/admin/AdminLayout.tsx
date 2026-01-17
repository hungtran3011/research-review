import { NavLink, Outlet, Navigate, useLocation } from 'react-router';
import { makeStyles, Text, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: '16px',
    alignItems: 'start',
  },
  sideNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '12px',
  },
  sideLink: {
    textDecoration: 'none',
    color: 'inherit',
    padding: '8px 10px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid transparent`,
    ':hover': {
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  sideLinkActive: {
    textDecoration: 'none',
    padding: '8px 10px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorBrandStroke1}`,
    color: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  content: {
    minWidth: 0,
  },
});

const AdminLayout = () => {
  const classes = useStyles();
  const location = useLocation();

  // Default landing: /admin -> /admin/users
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to="/admin/users" replace />;
  }

  const links = [
    { to: '/admin/users', label: 'Người dùng' },
    { to: '/admin/tracks', label: 'Track' },
    { to: '/admin/institutions', label: 'Nơi công tác' },
  ];

  return (
    <div className={classes.container}>
      <Text size={600} weight="semibold">
        Quản trị
      </Text>

      <div className={classes.layout}>
        <div className={classes.sideNav}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? classes.sideLinkActive : classes.sideLink)}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className={classes.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
