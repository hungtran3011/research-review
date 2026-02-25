import {
  Button,
  Menu,
  MenuPopover,
  MenuTrigger,
  Badge,
  Text,
  Spinner,
  makeStyles,
  MenuList,
} from "@fluentui/react-components";
import { DismissRegular, Alert20Regular } from "@fluentui/react-icons";
import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../services/api";
import type { BaseResponseDto, PageResponseDto } from "../../models";
import { ArticleStatus } from "../../constants/article-status";

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

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  badge: {
    position: "relative",
  },
  menuContent: {
    maxHeight: "400px",
    overflowY: "auto",
    overflowX: "hidden",
    minWidth: "450px",
    // maxWidth: "500px",
  },
  notificationItem: {
    padding: "12px",
    borderBottom: "1px solid #e0e0e0",
    cursor: "pointer",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  },
  notificationItemUnread: {
    backgroundColor: "#fff4ce",
  },
  notificationText: {
    fontSize: "12px",
    color: "#666",
    display: "block",
    lineHeight: "1.4",
  },
  emptyState: {
    padding: "16px",
    textAlign: "center" as const,
    color: "#999",
  },
});

export const NotificationCenter = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
      ARTICLE_SUBMITTED: "Bài báo đã nộp",
      ARTICLE_STATUS_CHANGED: "Trạng thái bài báo thay đổi",
      ARTICLE_REVISION_SUBMITTED: "Tác giả đã nộp bản sửa",
      REVIEWER_INVITED: "Mời phản biện",
      REVIEWER_REVOKED: "Thu hồi phản biện",
      COMMENT_ACTIVITY: "Hoạt động nhận xét",
      FILE_UPLOADED: "Tệp đã tải lên",
    };
    return labels[type] || type;
  };

  const getArticleStatusLabel = (status: unknown): string => {
    if (typeof status !== 'string') return ''
    const labels: Record<string, string> = {
      [ArticleStatus.SUBMITTED]: 'Đã nộp',
      [ArticleStatus.PENDING_REVIEW]: 'Chờ phản biện',
      [ArticleStatus.IN_REVIEW]: 'Đang phản biện',
      [ArticleStatus.REVISIONS_REQUESTED]: 'Yêu cầu sửa',
      [ArticleStatus.REVISIONS]: 'Đang sửa',
      [ArticleStatus.REJECT_REQUESTED]: 'Đề nghị loại bỏ',
      [ArticleStatus.ACCEPT_REQUESTED]: 'Đề nghị chấp thuận',
      [ArticleStatus.REJECTED]: 'Đã từ chối',
      [ArticleStatus.ACCEPTED]: 'Đã chấp nhận',
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
        lines.push(`${author ? author + ': ' : ''}${preview || 'Có cập nhật nhận xét'}`)
      }

      const metaParts: string[] = []
      if (pageNumber !== null) metaParts.push(`Trang ${pageNumber}`)
      if (version !== null) metaParts.push(`v${version}`)
      if (action) metaParts.push(action)
      if (status) metaParts.push(status)
      if (section) metaParts.push(section)
      if (metaParts.length > 0) lines.push(metaParts.join(' • '))

      return lines
    }

    if (notification.type === 'ARTICLE_REVISION_SUBMITTED') {
      const version = typeof p.version === 'number' ? p.version : null
      return [version !== null ? `Đã nộp bản sửa v${version}` : 'Đã nộp bản sửa']
    }

    if (notification.type === 'REVIEWER_INVITED') {
      const email = typeof p.email === 'string' ? p.email : ''
      return email ? [`Mời: ${email}`] : []
    }

    return []
  }

  return (
    <div className={styles.container}>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <div style={{ position: "relative" }}>
            <Button
              icon={<Alert20Regular />}
              appearance="subtle"
              aria-label="Notifications"
            />
            {unreadCount > 0 && (
              <Badge
                appearance="filled"
                color="danger"
                size="small"
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  minWidth: "16px",
                  height: "16px",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </div>
        </MenuTrigger>
        <MenuPopover className={styles.menuContent}>
          <MenuList>
            <div className={styles.menuContent}>
              {loading && notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <Spinner size="small" />
                </div>
              ) : notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text>No notifications</Text>
                </div>
              ) : (
                notifications.map((notification) => {
                  const title = getNotificationTitle(notification.payload)
                  const detailLines = getNotificationDetailLines(notification)
                  return (
                    <div
                      key={notification.id}
                      className={`${styles.notificationItem} ${!notification.readAt ? styles.notificationItemUnread : ""
                        }`}
                      onClick={() => handleNotificationClick(notification)}
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
                            <Text weight="semibold" size={300}>
                              {getNotificationLabel(notification.type)}
                            </Text>
                          </div>
                          {title && (
                            <div className={styles.notificationText} style={{ marginBottom: "4px" }}>
                              {title}
                            </div>
                          )}
                          {detailLines.map((line, idx) => (
                            <div
                              key={`${notification.id}_detail_${idx}`}
                              className={styles.notificationText}
                              style={{ marginBottom: idx === detailLines.length - 1 ? "4px" : "2px" }}
                            >
                              {line}
                            </div>
                          ))}
                          <div className={styles.notificationText}>
                            {new Date(notification.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                        {!notification.readAt && (
                          <Button
                            icon={<DismissRegular />}
                            appearance="subtle"
                            size="small"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                          />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  );
};
