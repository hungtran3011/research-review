import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const Unauthorized = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t('unauthorized.title')} - Research Review`;
  }, [t]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="403"
        title={t('unauthorized.title')}
        subTitle={t('unauthorized.subtitle')}
        extra={<Button type="primary" onClick={() => navigate('/')}>{t('unauthorized.backHome')}</Button>}
      />
    </div>
  );
};

export default Unauthorized;
