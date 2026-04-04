import { CloseCircleOutlined } from '@ant-design/icons';
import { Typography, theme as antdTheme } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text, Title, Link } = Typography;

function VerifyFailed() {
  const { t } = useTranslation('common')
  const { token } = antdTheme.useToken()
  document.title = `${t('verifyFailed.pageTitle')} - Research Review`;
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 64px)',
      padding: '24px 16px',
      background: token.colorBgLayout,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px',
        padding: '28px 24px',
        borderRadius: '12px',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
      }}>
        <CloseCircleOutlined style={{ fontSize: '48px', color: token.colorError }} />
        <Title level={2} style={{ margin: 0, color: token.colorText }}>{t('verifyFailed.title')}</Title>
        <Text style={{ color: token.colorTextSecondary }}>
          {t('verifyFailed.messagePrefix')} <Link href="/signup">{t('verifyFailed.linkText')}</Link>
        </Text>
      </div>
    </div>
  );
}

export default VerifyFailed;