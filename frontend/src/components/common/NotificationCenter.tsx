import {
  Button,
  Dropdown,
  Badge,
  Typography,
  Spin,
  theme as antdTheme,
} from "antd";
import { BellOutlined, CloseOutlined } from "@ant-design/icons";
import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../services/api";
import type { BaseResponseDto, PageResponseDto } from "../../models";
import { ArticleStatus } from "../../constants/article-status";
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface NotificationPayload {
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: string;
  payload: NotificationPayload;
  contextId?: string;
  contextType?: string;
  readAt?: string;
  createdAt: string;
}

export const NotificationCenter = () => {
  const { token } = antdTheme.useToken();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const response = await api.get<BaseResponseDto<PageResponseDto<Notification>>>(
        "/notifications?page=0&size=10"
      );
      const notifs = response.data.data?.content || [];
      setNotifications(notifs);
      const unread = notifs.filter((n: Notification) => !n.readAt).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(
    async (notificationId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await api.post(
          `/notifications/${notificationId}/read`
        );
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    []
  );

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.readAt);
    if (unreadNotifications.length === 0) return;

    try {
      setMarkingAllRead(true);
      await Promise.allSettled(
        unreadNotifications.map((notification) =>
          api.post(`/notifications/${notification.id}/read`)
        )
      );

      const readAt = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.readAt ? notification : { ...notification, readAt }
        )
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setMarkingAllRead(false);
    }
  }, [notifications]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Special-case reviewer invite: always go to the invitation page.
      if (notification.type === 'REVIEWER_INVITED') {
        const inviteUrl = notification.payload.inviteUrl
        if (typeof inviteUrl === 'string' && inviteUrl.length > 0) {
          try {
            const url = new URL(inviteUrl, window.location.origin)
            navigate(`${url.pathname}${url.search}`)
          } catch {
            // Fallback for relative URLs or malformed strings
            if (inviteUrl.startsWith('/')) {
              navigate(inviteUrl)
            }
          }
        }
      } else if (notification.payload.articleId && typeof notification.payload.articleId === 'string') {
        navigate(`/articles/${notification.payload.articleId}`);
      }
      if (!notification.readAt) {
        handleMarkAsRead(notification.id, { stopPropagation: () => { } } as React.MouseEvent);
      }
    },
    [navigate, handleMarkAsRead]
  );

  const getNotificationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      ARTICLE_SUBMITTED: t('notifications.types.articleSubmitted'),
      ARTICLE_STATUS_CHANGED: t('notifications.types.articleStatusChanged'),
      ARTICLE_REVISION_SUBMITTED: t('notifications.types.articleRevisionSubmitted'),
      REVIEWER_INVITED: t('notifications.types.reviewerInvited'),
      REVIEWER_REVOKED: t('notifications.types.reviewerRevoked'),
      COMMENT_ACTIVITY: t('notifications.types.commentActivity'),
      FILE_UPLOADED: t('notifications.types.fileUploaded'),
    };
    return labels[type] || type;
  };

  const getArticleStatusLabel = (status: unknown): string => {
    if (typeof status !== 'string') return ''
    const labels: Record<string, string> = {
      [ArticleStatus.SUBMITTED]: t('notifications.articleStatus.submitted'),
      [ArticleStatus.PENDING_REVIEW]: t('notifications.articleStatus.pendingReview'),
      [ArticleStatus.IN_REVIEW]: t('notifications.articleStatus.inReview'),
      [ArticleStatus.REVIEWS_COMPLETED]: t('notifications.articleStatus.reviewsCompleted'),
      [ArticleStatus.REVISIONS_REQUESTED]: t('notifications.articleStatus.revisionsRequested'),
      [ArticleStatus.REVISIONS]: t('notifications.articleStatus.revisions'),
      [ArticleStatus.REJECT_REQUESTED]: t('notifications.articleStatus.rejectRequested'),
      [ArticleStatus.ACCEPT_REQUESTED]: t('notifications.articleStatus.acceptRequested'),
      [ArticleStatus.REJECTED]: t('notifications.articleStatus.rejected'),
      [ArticleStatus.ACCEPTED]: t('notifications.articleStatus.accepted'),
    }
    return labels[status] || status
  }

  const getNotificationTitle = (payload: NotificationPayload): string => {
    const title = payload.title
    if (typeof title === 'string' && title.trim()) return title
    const articleTitle = payload.articleTitle
    if (typeof articleTitle === 'string' && articleTitle.trim()) return articleTitle
    return ''
  }

  const getNotificationDetailLines = (notification: Notification): string[] => {
    const p = notification.payload

    if (notification.type === 'ARTICLE_STATUS_CHANGED') {
      const prev = getArticleStatusLabel(p.previousStatus)
      const cur = getArticleStatusLabel(p.currentStatus)
      if (prev && cur) return [`${prev} → ${cur}`]
      return []
    }

    if (notification.type === 'COMMENT_ACTIVITY') {
      const author = typeof p.commentAuthor === 'string' ? p.commentAuthor : ''
      const preview = typeof p.commentPreview === 'string' ? p.commentPreview : ''
      const action = typeof p.action === 'string' ? p.action : ''
      const status = typeof p.status === 'string' ? p.status : ''
      const version = typeof p.version === 'number' ? p.version : null
      const pageNumber = typeof p.pageNumber === 'number' ? p.pageNumber : null
      const section = typeof p.section === 'string' ? p.section : ''

      const lines: string[] = []
      if (author || preview) {
        lines.push(`${author ? author + ': ' : ''}${preview || t('notifications.commentUpdated')}`)
      }

      const metaParts: string[] = []
      if (pageNumber !== null) metaParts.push(t('notifications.pageNumber', { page: pageNumber }))
      if (version !== null) metaParts.push(`v${version}`)
      if (action) metaParts.push(action)
      if (status) metaParts.push(status)
      if (section) metaParts.push(section)
      if (metaParts.length > 0) lines.push(metaParts.join(' • '))

      return lines
    }

    if (notification.type === 'ARTICLE_REVISION_SUBMITTED') {
      const version = typeof p.version === 'number' ? p.version : null
      return [version !== null ? t('notifications.revisionSubmittedVersion', { version }) : t('notifications.revisionSubmitted')]
    }

    if (notification.type === 'REVIEWER_INVITED') {
      const email = typeof p.email === 'string' ? p.email : ''
      return email ? [t('notifications.invitedEmail', { email })] : []
    }

    return []
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Dropdown
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        trigger={['click']}
        dropdownRender={() => (
          <div style={{
            maxHeight: "400px",
            overflowY: "auto",
            overflowX: "hidden",
            minWidth: "450px",
            backgroundColor: token.colorBgElevated,
            borderRadius: '4px',
            boxShadow: token.boxShadowSecondary,
          }}>
            <div
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text strong>{t('notifications.title')}</Text>
              <Button
                type="link"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleMarkAllAsRead();
                }}
                disabled={unreadCount === 0}
                loading={markingAllRead}
                style={{ paddingInline: 0 }}
              >
                {t('notifications.markAllRead')}
              </Button>
            </div>
            {loading && notifications.length === 0 ? (
              <div style={{
                padding: "16px",
                textAlign: "center",
                color: token.colorTextSecondary,
              }}>
                <Spin size="small" />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: "16px",
                textAlign: "center",
                color: token.colorTextSecondary,
              }}>
                <Text>{t('notifications.empty')}</Text>
              </div>
            ) : (
              notifications.map((notification) => {
                const title = getNotificationTitle(notification.payload)
                const detailLines = getNotificationDetailLines(notification)
                return (
                  <div
                    key={notification.id}
                    style={{
                      padding: "12px",
                      borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      cursor: "pointer",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      backgroundColor: !notification.readAt ? token.colorWarningBg : "transparent",
                    }}
                    onClick={() => {
                      handleNotificationClick(notification)
                      setDropdownOpen(false)
                    }}
                    onMouseEnter={(e) => !notification.readAt && (e.currentTarget.style.backgroundColor = token.colorWarningBgHover)}
                    onMouseLeave={(e) => !notification.readAt && (e.currentTarget.style.backgroundColor = token.colorWarningBg)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: "4px" }}>
                          <Text strong style={{ fontSize: '14px' }}>
                            {getNotificationLabel(notification.type)}
                          </Text>
                        </div>
                        {title && (
                          <div style={{
                            fontSize: "12px",
                            color: token.colorTextSecondary,
                            display: "block",
                            lineHeight: "1.4",
                            marginBottom: "4px",
                          }}>
                            {title}
                          </div>
                        )}
                        {detailLines.map((line, idx) => (
                          <div
                            key={`${notification.id}_detail_${idx}`}
                            style={{
                              fontSize: "12px",
                              color: token.colorTextSecondary,
                              display: "block",
                              lineHeight: "1.4",
                              marginBottom: idx === detailLines.length - 1 ? "4px" : "2px",
                            }}
                          >
                            {line}
                          </div>
                        ))}
                        <div style={{
                          fontSize: "12px",
                          color: token.colorTextSecondary,
                          display: "block",
                          lineHeight: "1.4",
                        }}>
                          {new Date(notification.createdAt).toLocaleString(i18n.language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US')}
                        </div>
                      </div>
                      {!notification.readAt && (
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                        />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      >
        <Button
          type="text"
          icon={<BellOutlined />}
          aria-label={t('notifications.ariaLabel')}
        />
      </Dropdown>
      {unreadCount > 0 && (
        <Badge
          count={unreadCount > 9 ? '9+' : unreadCount}
          style={{
            backgroundColor: token.colorError,
            position: "absolute",
            top: -20,
            right: unreadCount > 9 ? -12 : -4,
          }}
        />
      )}
    </div>
  );
};
