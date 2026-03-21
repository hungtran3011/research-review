import { useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Layout, List, Row, Space, Spin, Statistic, Typography } from 'antd'
import { FileSearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useAuthStore } from './stores/authStore'
import { useArticles } from './hooks/useArticles'
import { ArticleStatus } from './constants'
import type { ArticleStatusType } from './constants'
import type { ArticleDto } from './models'

const { Content, Footer } = Layout
const { Title, Paragraph, Text } = Typography

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userEmail = useAuthStore((state) => state.email)
  const [page, setPage] = useState(0)
  const pageSize = 5
  const { data, isLoading, isError } = useArticles(page, pageSize)

  const pageData = data?.data
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = pageData?.pageNumber ?? page

  const articles = useMemo(() => pageData?.content ?? [], [pageData])

  const statusLabelMap: Record<string, { label: string; color: 'default' | 'processing' | 'error' | 'success' | 'warning' }> = {
    [ArticleStatus.SUBMITTED]: { label: 'Chờ xử lý', color: 'processing' },
    [ArticleStatus.PENDING_REVIEW]: { label: 'Chờ phản biện', color: 'processing' },
    [ArticleStatus.IN_REVIEW]: { label: 'Đang phản biện', color: 'warning' },
    [ArticleStatus.REVIEWS_COMPLETED]: { label: 'Đã hoàn tất phản biện', color: 'processing' },
    [ArticleStatus.REVISIONS_REQUESTED]: { label: 'Yêu cầu sửa', color: 'warning' },
    [ArticleStatus.REVISIONS]: { label: 'Đang sửa', color: 'warning' },
    [ArticleStatus.ACCEPTED]: { label: 'Đã chấp nhận', color: 'success' },
    [ArticleStatus.REJECTED]: { label: 'Bị từ chối', color: 'error' },
    [ArticleStatus.REJECT_REQUESTED]: { label: 'Đề nghị loại bỏ', color: 'error' },
    [ArticleStatus.ACCEPT_REQUESTED]: { label: 'Đề nghị chấp thuận', color: 'processing' },
  }

  const stats = useMemo(() => {
    const pendingStatuses: ArticleStatusType[] = [
      ArticleStatus.SUBMITTED,
      ArticleStatus.PENDING_REVIEW,
      ArticleStatus.IN_REVIEW,
      ArticleStatus.REVISIONS_REQUESTED,
      ArticleStatus.REVISIONS,
    ]
    return {
      total: articles.length,
      pending: articles.filter((article) => pendingStatuses.includes(article.status)).length,
      accepted: articles.filter((article) => article.status === ArticleStatus.ACCEPTED).length,
      rejected: articles.filter((article) => article.status === ArticleStatus.REJECTED).length,
    }
  }, [articles])

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: 'transparent' }}>
      <Content style={{ padding: 16 }}>
        <Space direction='vertical' size={16} style={{ width: '100%' }}>
          <Card>
            <Title level={2} style={{ marginBottom: 8 }}>
              Welcome to Research Review
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
              {isAuthenticated
                ? `Hello, ${userEmail}! Manage your submissions and reviews.`
                : 'Sign up to submit and review research articles.'}
            </Paragraph>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                <Card
                  title='Bài báo gần đây'
                  extra={
                    <Space>
                      <Button
                        size='small'
                        disabled={isLoading || currentPage <= 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        Trang trước
                      </Button>
                      <Button
                        size='small'
                        disabled={isLoading || (totalPages > 0 && currentPage >= totalPages - 1)}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Trang sau
                      </Button>
                    </Space>
                  }
                >
                  {isLoading && (
                    <Space>
                      <Spin size='small' />
                      <Text>Đang tải danh sách bài báo...</Text>
                    </Space>
                  )}

                  {isError && !isLoading && <Text type='danger'>Không thể tải danh sách bài báo.</Text>}

                  {!isLoading && !isError && articles.length === 0 && (
                    <Text type='secondary'>Chưa có bài báo nào trong hệ thống.</Text>
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
                                Xem chi tiết
                              </Button>,
                            ]}
                          >
                            <List.Item.Meta
                              title={article.title}
                              description={article.track?.name ? `Track: ${article.track.name}` : undefined}
                            />
                            <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'xem thêm' }}>
                              {article.abstract}
                            </Paragraph>
                            <Text type='secondary'>
                              Gửi lúc: {article.createdAt ? new Date(article.createdAt).toLocaleString('vi-VN') : '—'}
                            </Text>
                          </List.Item>
                        )
                      }}
                    />
                  )}

                  <div style={{ marginTop: 12 }}>
                    <Text type='secondary'>
                      Trang {currentPage + 1}
                      {totalPages > 0 ? ` / ${totalPages}` : ''}
                    </Text>
                  </div>
                </Card>

                <Card title='Quick Actions'>
                  <Space>
                    <Button type='primary' href='/articles/submit' icon={<PlusOutlined />}>
                      Submit New Article
                    </Button>
                    <Button href='/articles' icon={<FileSearchOutlined />}>
                      View My Reviews
                    </Button>
                  </Space>
                </Card>
              </Space>
            </Col>

            {isAuthenticated && (
              <Col xs={24} lg={8}>
                <Space direction='vertical' size={16} style={{ width: '100%' }}>
                  <Card title='Stats'>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Statistic title='Total articles' value={stats.total} />
                    </Col>
                    <Col span={12}>
                      <Statistic title='Pending review' value={stats.pending} />
                    </Col>
                    <Col span={12}>
                      <Statistic title='Accepted' value={stats.accepted} />
                    </Col>
                    <Col span={12}>
                      <Statistic title='Rejected' value={stats.rejected} />
                    </Col>
                  </Row>
                  </Card>

                  <Card title='Notifications'>
                    <Text type='secondary'>New review request received.</Text>
                  </Card>
                </Space>
              </Col>
            )}
          </Row>
        </Space>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        <Space size={8}>
          <Text>© 2026 Research Review. All rights reserved.</Text>
          <Button type='link' href='/help' style={{ padding: 0 }}>
            Help
          </Button>
        </Space>
      </Footer>
    </Layout>
  )
}

export default App
