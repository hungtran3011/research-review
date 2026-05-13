import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ArticleStatusTag } from '../components/article/ArticleStatusTag';
import { ArticleStatus } from '../constants/article-status';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key, // Just return the key for simplicity
    }),
}));

describe('ArticleStatusTag', () => {
    it('renders the correct label for SUBMITTED status', () => {
        render(<ArticleStatusTag status={ArticleStatus.SUBMITTED} />);
        expect(screen.getByTestId('article-status-tag')).toHaveTextContent('notifications.articleStatus.submitted');
    });

    it('renders the correct label for ACCEPTED status', () => {
        render(<ArticleStatusTag status={ArticleStatus.ACCEPTED} />);
        expect(screen.getByTestId('article-status-tag')).toHaveTextContent('notifications.articleStatus.accepted');
    });

    it('renders the correct label for REJECTED status', () => {
        render(<ArticleStatusTag status={ArticleStatus.REJECTED} />);
        expect(screen.getByTestId('article-status-tag')).toHaveTextContent('notifications.articleStatus.rejected');
    });

    it('renders the correct label for IN_REVIEW status', () => {
        render(<ArticleStatusTag status={ArticleStatus.IN_REVIEW} />);
        expect(screen.getByTestId('article-status-tag')).toHaveTextContent('notifications.articleStatus.inReview');
    });
});
