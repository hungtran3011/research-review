import { useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Row, Space, Tag, Typography, theme as antdTheme } from 'antd'
import { useNavigate, useSearchParams } from 'react-router'
import { useSubmissionMetadata } from '../../hooks/useArticles'
import { useCurrentUser } from '../../hooks/useUser'
import { useAuthStore } from '../../stores/authStore'
import { useRegisterConference } from '../../hooks/useConferenceRegistration'
import { useTranslation } from 'react-i18next'

const { Title, Text } = Typography

function ConferenceRegistration() {
  const { t, i18n } = useTranslation('common')
  const { token } = antdTheme.useToken()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [registeringConferenceId, setRegisteringConferenceId] = useState<string | null>(null)

  const returnTo = searchParams.get('returnTo') || '/articles/submit'
  const preferredConferenceId = searchParams.get('conferenceId') || ''

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { data: currentUserResponse } = useCurrentUser(Boolean(isAuthenticated))
  const { data: submissionMetadataResponse } = useSubmissionMetadata()
  const { mutateAsync: registerConference } = useRegisterConference()

  const conferences = submissionMetadataResponse?.data?.conferences ?? []
  const memberships = currentUserResponse?.data?.conferences ?? []
  const dateTimeLocale = i18n.language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'

  const membershipConferenceIds = useMemo(() => {
    return new Set(memberships.map((membership) => membership.conferenceId))
  }, [memberships])

  const goToSubmit = (conferenceId: string) => {
    const target = `/articles/submit?conferenceId=${encodeURIComponent(conferenceId)}`
    navigate(target)
  }

  const handleRegisterConference = async (conferenceId: string) => {
    setRegisteringConferenceId(conferenceId)
    try {
      await registerConference(conferenceId)
      if (!preferredConferenceId || preferredConferenceId === conferenceId) {
        const separator = returnTo.includes('?') ? '&' : '?'
        navigate(`${returnTo}${separator}conferenceId=${encodeURIComponent(conferenceId)}`)
      }
    } finally {
      setRegisteringConferenceId(null)
    }
  }

  return (
    <div
      style={{
        padding: '24px 16px',
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <Space direction="vertical" size={4}>
        <Title level={2} style={{ margin: 0 }}>{t('conferenceRegistration.title')}</Title>
        <Text type="secondary">{t('conferenceRegistration.subtitle')}</Text>
      </Space>

      <Alert
        type="info"
        showIcon
        message={t('conferenceRegistration.flow.message')}
        description={t('conferenceRegistration.flow.description')}
      />

      <Row gutter={[16, 16]}>
        {conferences.map((conference) => {
          const isRegistered = membershipConferenceIds.has(conference.id)
          const isDeadlinePassed = conference.submissionDeadline
            ? new Date(conference.submissionDeadline).getTime() < Date.now()
            : false

          return (
            <Col key={conference.id} xs={24} md={12} lg={8}>
              <Card
                title={`${conference.name} (${conference.shortName})`}
                styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12 } }}
                style={{ borderColor: preferredConferenceId === conference.id ? token.colorPrimaryBorder : undefined }}
              >
                <Space size={8} wrap>
                  {isRegistered ? (
                    <Tag color="success">{t('conferenceRegistration.tags.registered')}</Tag>
                  ) : (
                    <Tag color="warning">{t('conferenceRegistration.tags.notRegistered')}</Tag>
                  )}
                  {isDeadlinePassed && (
                    <Tag color="error">{t('conferenceRegistration.tags.deadlinePassed')}</Tag>
                  )}
                </Space>

                {conference.submissionDeadline && (
                  <Text type="secondary">
                    {t('conferenceRegistration.deadline')}: {new Date(conference.submissionDeadline).toLocaleString(dateTimeLocale)}
                  </Text>
                )}

                <Space>
                  {!isRegistered && !isDeadlinePassed && (
                    <Button
                      type="primary"
                      onClick={() => void handleRegisterConference(conference.id)}
                      loading={registeringConferenceId === conference.id}
                    >
                      {t('conferenceRegistration.actions.register')}
                    </Button>
                  )}

                  {isRegistered && (
                    <Button onClick={() => goToSubmit(conference.id)}>
                      {t('conferenceRegistration.actions.goToSubmit')}
                    </Button>
                  )}
                </Space>
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}

export default ConferenceRegistration
