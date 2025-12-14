import { useMemo } from 'react';
import './App.css'
import { Button, Text, Card, CardHeader, CardPreview, Badge, Spinner } from '@fluentui/react-components'
import { makeStyles } from '@fluentui/react-components'
import { Add16Regular, Document16Regular } from '@fluentui/react-icons';
import { useAuthStore } from './stores/authStore';
import { useArticles } from './hooks/useArticles';
import { ArticleStatus } from './constants';
import type { ArticleStatusType } from './constants';
import type { ArticleDto } from './models';

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
  const { data, isLoading, isError } = useArticles(0, 5);

  const articles = useMemo(() => data?.data?.content ?? [], [data]);

  const statusLabelMap: Record<string, { label: string; color: 'brand' | 'informative' | 'important' | 'success' }> = {
    [ArticleStatus.SUBMITTED]: { label: 'Chờ xử lý', color: 'informative' },
    [ArticleStatus.PENDING_REVIEW]: { label: 'Chờ phản biện', color: 'informative' },
    [ArticleStatus.IN_REVIEW]: { label: 'Đang phản biện', color: 'brand' },
    [ArticleStatus.ACCEPTED]: { label: 'Đã chấp nhận', color: 'success' },
    [ArticleStatus.REJECTED]: { label: 'Bị từ chối', color: 'important' },
    [ArticleStatus.REJECT_REQUESTED]: { label: 'Đề nghị loại bỏ', color: 'important' },
  };

  const stats = useMemo(() => {
    const pendingStatuses: ArticleStatusType[] = [
      ArticleStatus.SUBMITTED,
      ArticleStatus.PENDING_REVIEW,
      ArticleStatus.IN_REVIEW,
    ];
    return {
      total: articles.length,
      pending: articles.filter((article) => pendingStatuses.includes(article.status)).length,
      accepted: articles.filter((article) => article.status === ArticleStatus.ACCEPTED).length,
      rejected: articles.filter((article) => article.status === ArticleStatus.REJECTED).length,
    };
  }, [articles]);

  const renderArticle = (article: ArticleDto) => {
    const status = statusLabelMap[article.status] ?? { label: article.status, color: 'informative' as const };
    return (
      <Card key={article.id} className={classes.card} style={{ marginBottom: '12px' }}>
        <CardHeader
          header={<Text weight="semibold">{article.title}</Text>}
          description={article.track?.name ? `Track: ${article.track.name}` : undefined}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Text size={200}>{article.abstract}</Text>
            <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
              Gửi lúc: {article.createdAt ? new Date(article.createdAt).toLocaleString('vi-VN') : '—'}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Badge appearance="filled" color={status.color}>{status.label}</Badge>
            <Button as="a" href={`/articles/${article.id}`} appearance="primary" size="small">
              Xem chi tiết
            </Button>
          </div>
        </div>
      </Card>
    );
  };

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
            <CardHeader header={<Text weight="semibold">Bài báo gần đây</Text>} />
            <CardPreview>
              {isLoading && <Spinner label="Đang tải danh sách bài báo..." />} 
              {isError && !isLoading && (
                <Text size={300}>
                  Không thể tải danh sách bài báo.
                </Text>
              )}
              {!isLoading && !isError && articles.length === 0 && (
                <Text size={300}>Chưa có bài báo nào trong hệ thống.</Text>
              )}
            </CardPreview>
            {!isLoading && !isError && articles.length > 0 && (
              <div>
                {articles.map(renderArticle)}
              </div>
            )}
          </Card>
          <Card className={classes.card}>
            <CardHeader header={<Text weight="semibold">Quick Actions</Text>} />
            <Button icon={<Add16Regular />} appearance="primary" as='a' href='/articles/submit'>
              Submit New Article
            </Button>
            <Button icon={<Document16Regular />} as='a' href='/articles'>View My Reviews</Button>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={classes.sidebar}>
          <Card className={classes.card}>
            <CardHeader header={<Text weight="semibold">Stats</Text>} />
            <Text size={300}>Total articles: {stats.total}</Text>
            <Text size={300}>Pending review: {stats.pending}</Text>
            <Text size={300}>Accepted: {stats.accepted}</Text>
            <Text size={300}>Rejected: {stats.rejected}</Text>
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
