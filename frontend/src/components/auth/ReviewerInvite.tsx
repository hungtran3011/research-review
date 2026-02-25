import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button, Spinner, Text, makeStyles } from '@fluentui/react-components';
import { reviewerInviteService } from '../../services/reviewerInvite.service';
import { useAuthStore } from '../../stores/authStore';
import { useBasicToast } from '../../hooks/useBasicToast';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: '16px',
    height: '100%',
    flexGrow: 1,
    padding: '0 16px',
  },

  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

function ReviewerInvite() {
  const classes = useStyles();
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

  document.title = 'Reviewer Invitation - Research Review';

  React.useEffect(() => {
    if (!token) {
      navigate('/signin', { replace: true });
      return;
    }

    // Prevent repeated resolve calls on re-renders.
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
          throw new Error(resolved.message || 'Invalid invitation token');
        }
        setEmail(email);
        setArticleId(aId);
        setArticleTitle(title ?? null);
        setTrackName(track ?? null);
        setAuthors(Array.isArray(authorList) ? authorList.filter((x) => typeof x === 'string') : []);
      } catch (e: unknown) {
        const maybeAxios = e as { response?: { data?: { message?: string } } }
        const maybeError = e as { message?: string }
        showErrorToast(
          'Invitation invalid',
          maybeAxios.response?.data?.message || maybeError.message || 'Invalid invitation token'
        );
        navigate('/signin', { replace: true });
      } finally {
        setIsResolving(false);
      }
    })();
  }, [navigate, token, setEmail, setInviteToken, showErrorToast]);

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
      const maybeAxios = e as { response?: { data?: { message?: string } } }
      const maybeError = e as { message?: string }
      showErrorToast(
        'Không thể chấp nhận lời mời',
        maybeAxios.response?.data?.message || maybeError.message || 'Có lỗi xảy ra'
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
      const maybeAxios = e as { response?: { data?: { message?: string } } }
      const maybeError = e as { message?: string }
      showErrorToast(
        'Không thể từ chối lời mời',
        maybeAxios.response?.data?.message || maybeError.message || 'Có lỗi xảy ra'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={classes.root}>
      {(isResolving || !articleId) ? (
        <>
          <Spinner size="large" />
          <Text>Đang xử lý lời mời phản biện...</Text>
        </>
      ) : (
        <>
          <Text as="h1" weight="bold" size={500}>Lời mời phản biện</Text>
          <Text align="center">Bạn được mời phản biện bài báo sau:</Text>
          <Text align="center" weight="semibold">
            {articleTitle || `ID: ${articleId}`}
          </Text>
          {authors.length > 0 && (
            <Text align="center">Tác giả: {authors.join(', ')}</Text>
          )}
          {trackName && (
            <Text align="center">Track: {trackName}</Text>
          )}

          {!isAuthenticated ? (
            <>
              <Text align="center">Vui lòng đăng nhập hoặc đăng ký để xác nhận.</Text>
              <div className={classes.actions}>
                <Button appearance="primary" onClick={handleGoSignIn}>Đăng nhập</Button>
                <Button appearance="secondary" onClick={handleGoSignUp}>Đăng ký</Button>
              </div>
            </>
          ) : (
            <div className={classes.actions}>
              <Button appearance="primary" onClick={handleAccept} disabled={isSubmitting}>Nhận lời phản biện</Button>
              <Button appearance="secondary" onClick={handleDecline} disabled={isSubmitting}>Từ chối</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewerInvite;
