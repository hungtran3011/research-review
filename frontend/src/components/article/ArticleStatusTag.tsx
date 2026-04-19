import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArticleStatus } from '../../constants/article-status';
import type { ArticleStatusType } from '../../constants/article-status';

interface ArticleStatusTagProps {
    status: ArticleStatusType;
}

export const ArticleStatusTag: React.FC<ArticleStatusTagProps> = ({ status }) => {
    const { t } = useTranslation('common');

    const statusLabelMap: Record<ArticleStatusType, { label: string; color: string }> = {
        [ArticleStatus.SUBMITTED]: { label: t('notifications.articleStatus.submitted'), color: 'blue' },
        [ArticleStatus.PENDING_REVIEW]: { label: t('notifications.articleStatus.pendingReview'), color: 'cyan' },
        [ArticleStatus.IN_REVIEW]: { label: t('notifications.articleStatus.inReview'), color: 'orange' },
        [ArticleStatus.REVIEWS_COMPLETED]: { label: t('notifications.articleStatus.reviewsCompleted'), color: 'purple' },
        [ArticleStatus.REVISIONS_REQUESTED]: { label: t('notifications.articleStatus.revisionsRequested'), color: 'warning' },
        [ArticleStatus.REVISIONS]: { label: t('notifications.articleStatus.revisions'), color: 'volcano' },
        [ArticleStatus.ACCEPTED]: { label: t('notifications.articleStatus.accepted'), color: 'success' },
        [ArticleStatus.REJECTED]: { label: t('notifications.articleStatus.rejected'), color: 'error' },
        [ArticleStatus.ACCEPT_REQUESTED]: { label: t('notifications.articleStatus.acceptRequested'), color: 'warning' },
        [ArticleStatus.REJECT_REQUESTED]: { label: t('notifications.articleStatus.rejectRequested'), color: 'warning' },
    };

    const statusInfo = statusLabelMap[status] || { label: status, color: 'default' };

    return (
        <Tag color={statusInfo.color} data-testid="article-status-tag">
            {statusInfo.label}
        </Tag>
    );
};
