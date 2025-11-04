import React from 'react';
import './App.css'
import { Button, Text, Card, CardHeader, CardPreview } from '@fluentui/react-components'
import { makeStyles } from '@fluentui/react-components'
import { Add16Regular, Document16Regular } from '@fluentui/react-icons';
import { useAuthStore } from './stores/authStore'; // Assuming auth state for personalization

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    padding: '16px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
  },
  main: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    flexGrow: 1,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebar: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    padding: '16px',
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    padding: '16px',
    borderTop: '1px solid var(--colorNeutralStroke1)',
  },
});

function App() {
  const classes = useStyles();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userEmail = useAuthStore((state) => state.email);

  return (
    <div className={classes.wrapper}>
      {/* Header */}
      <div className={classes.header}>
        <Text as="h1" size={600}>Welcome to Research Review</Text>
        {isAuthenticated ? (
          <Text size={400}>Hello, {userEmail}! Manage your submissions and reviews.</Text>
        ) : (
          <Text size={400}>Sign up to submit and review research articles.</Text>
        )}
      </div>

      {/* Main Content */}
      <div className={classes.main}>
        {/* Primary Content */}
        <div className={classes.content}>
          <Card className={classes.card}>
            <CardHeader header={<Text weight="semibold">Recent Articles</Text>} />
            <CardPreview>
              <Text size={300}>List of recent articles here (e.g., via API).</Text>
            </CardPreview>
          </Card>
          <Card className={classes.card}>
            <CardHeader header={<Text weight="semibold">Quick Actions</Text>} />
            <Button icon={<Add16Regular />} appearance="primary">Submit New Article</Button>
            <Button icon={<Document16Regular />}>View My Reviews</Button>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={classes.sidebar}>
          <Card className={classes.card}>
            <CardHeader header={<Text weight="semibold">Stats</Text>} />
            <Text size={300}>Articles Submitted: 5</Text>
            <Text size={300}>Reviews Pending: 2</Text>
          </Card>
          <Card className={classes.card}>
            <CardHeader header={<Text weight="semibold">Notifications</Text>} />
            <Text size={300}>New review request received.</Text>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className={classes.footer}>
        <Text size={300}>© 2025 Research Review. All rights reserved.</Text>
        <Button as="a" href="/help" appearance="subtle">Help</Button>
      </div>
    </div>
  );
}

export default App;
