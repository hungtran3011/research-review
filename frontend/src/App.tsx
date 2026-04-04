import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Input, Layout, List, Row, Select, Space, Spin, Statistic, Typography } from 'antd'
import { FileSearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useAuthStore } from './stores/authStore'
import { useArticleDashboardStats, useArticles } from './hooks/useArticles'
import { useCurrentUser } from './hooks/useUser'
import { ArticleStatus } from './constants'
import type { ArticleStatusType } from './constants'
import type { ArticleDto } from './models'
import { useTranslation } from 'react-i18next'

const { Content, Footer } = Layout
const { Title, Paragraph, Text } = Typography

function App() {
  const { t, i18n } = useTranslation('common')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userEmail = useAuthStore((state) => state.email)
  const [page, setPage] = useState(0)
  const [titleFilter, setTitleFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<ArticleStatusType | ''>('')
  const pageSize = 5
  const { data: currentUserResponse } = useCurrentUser(isAuthenticated)
  const filters = useMemo(() => ({
    title: titleFilter,
    author: authorFilter,
    status: statusFilter,
  }), [titleFilter, authorFilter, statusFilter])
  const { data, isLoading, isError } = useArticles(page, pageSize, isAuthenticated, filters)
  const { data: statsResponse, isLoading: isStatsLoading } = useArticleDashboardStats(isAuthenticated, filters)

  const displayName = currentUserResponse?.data?.name?.trim() || currentUserResponse?.data?.email || userEmail || t('appHome.fallbackResearcher')

  const pageData = data?.data
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = pageData?.pageNumber ?? page

  const articles = useMemo(() => pageData?.content ?? [], [pageData])

  const statusLabelMap: Record<string, { label: string; color: 'default' | 'processing' | 'error' | 'success' | 'warning' }> = {
    [ArticleStatus.SUBMITTED]: { label: t('notifications.articleStatus.submitted'), color: 'processing' },
    [ArticleStatus.PENDING_REVIEW]: { label: t('notifications.articleStatus.pendingReview'), color: 'processing' },
    [ArticleStatus.IN_REVIEW]: { label: t('notifications.articleStatus.inReview'), color: 'warning' },
    [ArticleStatus.REVIEWS_COMPLETED]: { label: t('notifications.articleStatus.reviewsCompleted'), color: 'processing' },
    [ArticleStatus.REVISIONS_REQUESTED]: { label: t('notifications.articleStatus.revisionsRequested'), color: 'warning' },
    [ArticleStatus.REVISIONS]: { label: t('notifications.articleStatus.revisions'), color: 'warning' },
    [ArticleStatus.ACCEPTED]: { label: t('notifications.articleStatus.accepted'), color: 'success' },
    [ArticleStatus.REJECTED]: { label: t('notifications.articleStatus.rejected'), color: 'error' },
    [ArticleStatus.REJECT_REQUESTED]: { label: t('notifications.articleStatus.rejectRequested'), color: 'error' },
    [ArticleStatus.ACCEPT_REQUESTED]: { label: t('notifications.articleStatus.acceptRequested'), color: 'processing' },
  }

  const stats = statsResponse?.data ?? {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  }

  useEffect(() => {
    setPage(0)
  }, [titleFilter, authorFilter, statusFilter])

  useEffect(() => {
    document.title = `${t('nav.home')} - Research Review`
  }, [t])

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: 16 }}>
        <Space direction='vertical' size={16} style={{ width: '100%' }}>
          <Card>
            <Title level={2} style={{ marginBottom: 8 }}>
              {t('appHome.welcomeTitle')}
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
              {isAuthenticated
                ? t('appHome.welcomeAuthed', { name: displayName })
                : t('appHome.welcomeGuest')}
            </Paragraph>
          </Card>

          {!isAuthenticated && (
            <Card>
              <Space direction='vertical' size={12} style={{ width: '100%' }}>
                <Title level={3} style={{ marginBottom: 0 }}>
                  {t('appHome.landingTitle')}
                </Title>
                <Paragraph style={{ marginBottom: 0 }}>
                  {t('appHome.landingDescription')}
                </Paragraph>
                <Space wrap>
                  <Button type='primary' href='/signin'>
                    {t('appHome.signIn')}
                  </Button>
                  <Button href='/signup'>
                    {t('appHome.createAccount')}
                  </Button>
                  <Button type='link' href='/help' style={{ padding: 0 }}>
                    {t('appHome.learnMore')}
                  </Button>
                </Space>
              </Space>
            </Card>
          )}

          {isAuthenticated && (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Space direction='vertical' size={16} style={{ width: '100%' }}>
                  <Card
                    title={t('appHome.recentArticlesTitle')}
                    extra={
                      <Space>
                        <Button
                          size='small'
                          disabled={isLoading || currentPage <= 0}
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                          {t('appHome.prevPage')}
                        </Button>
                        <Button
                          size='small'
                          disabled={isLoading || (totalPages > 0 && currentPage >= totalPages - 1)}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          {t('appHome.nextPage')}
                        </Button>
                      </Space>
                    }
                  >
                    <Space wrap style={{ marginBottom: 12 }}>
                      <Input
                        placeholder={t('appHome.filterByTitle')}
                        allowClear
                        value={titleFilter}
                        onChange={(event) => setTitleFilter(event.target.value)}
                        style={{ width: 220 }}
                      />
                      <Input
                        placeholder={t('appHome.filterByAuthor')}
                        allowClear
                        value={authorFilter}
                        onChange={(event) => setAuthorFilter(event.target.value)}
                        style={{ width: 220 }}
                      />
                      <Select<ArticleStatusType | ''>
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 220 }}
                        options={[
                          { value: '', label: t('appHome.allStatuses') },
                          ...Object.entries(statusLabelMap).map(([value, item]) => ({ value: value as ArticleStatusType, label: item.label })),
                        ]}
                      />
                    </Space>

                    {isLoading && (
                      <Space>
                        <Spin size='small' />
                        <Text>{t('appHome.loadingArticles')}</Text>
                      </Space>
                    )}

                    {isError && !isLoading && <Text type='danger'>{t('appHome.loadArticlesFailed')}</Text>}

                    {!isLoading && !isError && articles.length === 0 && (
                      <Text type='secondary'>{t('appHome.noArticles')}</Text>
                    )}

                    {!isLoading && !isError && articles.length > 0 && (
                      <List
                        itemLayout='vertical'
                        dataSource={articles}
                        renderItem={(article: ArticleDto) => {
                          const status = statusLabelMap[article.status] ?? {
                            label: article.status,
                            color: 'default' as const,
                          }

                          return (
                            <List.Item
                              key={article.id}
                              actions={[
                                <Space key='status'>
                                  <Badge status={status.color} text={status.label} />
                                </Space>,
                                <Button key='view' type='primary' href={`/articles/${article.id}`}>
                                  {t('appHome.viewDetails')}
                                </Button>,
                              ]}
                            >
                              <List.Item.Meta
                                title={article.title}
                                description={article.track?.name ? t('appHome.trackLabel', { track: article.track.name }) : undefined}
                              />
                              <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: t('appHome.expandMore') }}>
                                {article.abstract}
                              </Paragraph>
                              <Text type='secondary'>
                                {t('appHome.submittedAt')} {article.createdAt ? new Date(article.createdAt).toLocaleString(i18n.language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US') : '—'}
                              </Text>
                            </List.Item>
                          )
                        }}
                      />
                    )}

                    <div style={{ marginTop: 12 }}>
                      <Text type='secondary'>
                        {t('appHome.pageLabel', { page: currentPage + 1 })}
                        {totalPages > 0 ? ` / ${totalPages}` : ''}
                      </Text>
                    </div>
                  </Card>

                  <Card title={t('appHome.quickActionsTitle')}>
                    <Space>
                      <Button type='primary' href='/articles/submit' icon={<PlusOutlined />}>
                        {t('appHome.submitNewArticle')}
                      </Button>
                      <Button href='/articles' icon={<FileSearchOutlined />}>
                        {t('appHome.viewMyReviews')}
                      </Button>
                    </Space>
                  </Card>
                </Space>
              </Col>

              <Col xs={24} lg={8}>
                <Space direction='vertical' size={16} style={{ width: '100%' }}>
                  <Card title={t('appHome.statsTitle')}>
                  {isStatsLoading ? (
                    <Space>
                      <Spin size='small' />
                      <Text type='secondary'>{t('appHome.loadingStats')}</Text>
                    </Space>
                  ) : (
                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <Statistic title={t('appHome.stats.total')} value={stats.total} />
                      </Col>
                      <Col span={12}>
                        <Statistic title={t('appHome.stats.pending')} value={stats.pending} />
                      </Col>
                      <Col span={12}>
                        <Statistic title={t('appHome.stats.accepted')} value={stats.accepted} />
                      </Col>
                      <Col span={12}>
                        <Statistic title={t('appHome.stats.rejected')} value={stats.rejected} />
                      </Col>
                    </Row>
                  )}
                  </Card>

                  <Card title={t('appHome.notificationsTitle')}>
                    <Text type='secondary'>{t('appHome.notificationsPlaceholder')}</Text>
                  </Card>
                </Space>
              </Col>
            </Row>
          )}
        </Space>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        <Space size={8}>
          <Text>{t('appHome.footerCopyright')}</Text>
          <Button type='link' href='/help' style={{ padding: 0 }}>
            {t('nav.help')}
          </Button>
        </Space>
      </Footer>
    </Layout>
  )
}

export default App
