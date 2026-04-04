import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button, Spin, Typography, theme as antdTheme } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
import { reviewerInviteService } from '../../services/reviewerInvite.service';
import { useAuthStore } from '../../stores/authStore';
import { useBasicToast } from '../../hooks/useBasicToast';

const { Title } = Typography;

function ReviewerInvite() {
  const { t } = useTranslation('common');
  const { token: themeToken } = antdTheme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const { error: showErrorToast } = useBasicToast();
  const { setEmail, setInviteToken, isAuthenticated } = useAuthStore();
  const [articleId, setArticleId] = React.useState<string | null>(null);
  const [articleTitle, setArticleTitle] = React.useState<string | null>(null);
  const [trackName, setTrackName] = React.useState<string | null>(null);
  const [authors, setAuthors] = React.useState<string[]>([]);
  const [isResolving, setIsResolving] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const token = React.useMemo(() => {
    return new URLSearchParams(location.search).get('token');
  }, [location.search]);

  const lastResolvedTokenRef = React.useRef<string | null>(null);

  document.title = `${t('reviewerInvite.pageTitle')} - Research Review`;

  React.useEffect(() => {
    if (!token) {
      navigate('/signin', { replace: true });
      return;
    }

    if (lastResolvedTokenRef.current === token) {
      return;
    }
    lastResolvedTokenRef.current = token;

    setInviteToken(token);

    (async () => {
      try {
        setIsResolving(true);
        const resolved = await reviewerInviteService.resolve(token);
        const email = resolved.data?.email;
        const aId = resolved.data?.articleId;
        const title = resolved.data?.articleTitle;
        const track = resolved.data?.trackName;
        const authorList = resolved.data?.authors;
        if (!email || !aId) {
          throw new Error(resolved.message || t('reviewerInvite.invalidToken'));
        }
        setEmail(email);
        setArticleId(aId);
        setArticleTitle(title ?? null);
        setTrackName(track ?? null);
        setAuthors(Array.isArray(authorList) ? authorList.filter((x) => typeof x === 'string') : []);
      } catch (e: unknown) {
        const maybeAxios = e as { response?: { data?: { message?: string } } };
        const maybeError = e as { message?: string };
        showErrorToast(
          maybeAxios.response?.data?.message || maybeError.message || t('reviewerInvite.invalidToken')
        );
        navigate('/signin', { replace: true });
      } finally {
        setIsResolving(false);
      }
    })();
  }, [navigate, token, setEmail, setInviteToken, showErrorToast, t]);

  const handleGoSignIn = () => {
    navigate('/signin');
  };

  const handleGoSignUp = () => {
    navigate('/signup');
  };

  const handleAccept = async () => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      const resp = await reviewerInviteService.accept(token);
      const aId = resp.data?.articleId || articleId;
      if (aId) {
        navigate(`/articles/${aId}/review`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (e: unknown) {
      const maybeAxios = e as { response?: { data?: { message?: string } } };
      const maybeError = e as { message?: string };
      showErrorToast(
        maybeAxios.response?.data?.message || maybeError.message || t('reviewerInvite.genericError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      await reviewerInviteService.decline(token);
      navigate('/', { replace: true });
    } catch (e: unknown) {
      const maybeAxios = e as { response?: { data?: { message?: string } } };
      const maybeError = e as { message?: string };
      showErrorToast(
        maybeAxios.response?.data?.message || maybeError.message || t('reviewerInvite.genericError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 64px)',
      padding: '24px 16px',
      background: themeToken.colorBgLayout,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px',
        padding: '28px 24px',
        borderRadius: '12px',
        background: themeToken.colorBgContainer,
        border: `1px solid ${themeToken.colorBorderSecondary}`,
        boxShadow: themeToken.boxShadowTertiary,
      }}>
        {(isResolving || !articleId) ? (
          <>
            <Spin size="large" />
            <Text style={{ color: themeToken.colorTextSecondary }}>{t('reviewerInvite.resolving')}</Text>
          </>
        ) : (
          <>
            <Title level={1} style={{ margin: 0, color: themeToken.colorText }}>{t('reviewerInvite.title')}</Title>
            <Text style={{ color: themeToken.colorTextSecondary }}>{t('reviewerInvite.description')}</Text>
            <Text strong style={{ color: themeToken.colorText }}>
              {articleTitle || t('reviewerInvite.articleId', { id: articleId })}
            </Text>
            {authors.length > 0 && (
              <Text style={{ color: themeToken.colorTextSecondary }}>{t('reviewerInvite.authors', { names: authors.join(', ') })}</Text>
            )}
            {trackName && (
              <Text style={{ color: themeToken.colorTextSecondary }}>{t('reviewerInvite.track', { track: trackName })}</Text>
            )}

            {!isAuthenticated ? (
              <>
                <Text style={{ color: themeToken.colorTextSecondary }}>{t('reviewerInvite.authRequired')}</Text>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  <Button type="primary" onClick={handleGoSignIn}>{t('reviewerInvite.signIn')}</Button>
                  <Button onClick={handleGoSignUp}>{t('reviewerInvite.signUp')}</Button>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                <Button type="primary" onClick={handleAccept} loading={isSubmitting}>{t('reviewerInvite.accept')}</Button>
                <Button onClick={handleDecline} loading={isSubmitting}>{t('reviewerInvite.decline')}</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ReviewerInvite;
