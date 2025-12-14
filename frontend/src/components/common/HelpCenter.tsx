import { Card, CardHeader, Text, Button, makeStyles, tokens } from '@fluentui/react-components'
import { Mail20Regular, Document16Regular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  wrapper: {
    minHeight: 'calc(100vh - 64px)',
    padding: '32px',
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    justifyContent: 'center',
  },
  container: {
    maxWidth: '720px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
})

function HelpCenter() {
  const classes = useStyles()

  return (
    <div className={classes.wrapper}>
      <div className={classes.container}>
        <Card className={classes.section}>
          <CardHeader
            header={<Text weight="semibold" size={500}>Trung tâm trợ giúp</Text>}
            description={<Text size={300}>Nhận hỗ trợ cho việc nộp bài, phản biện và quản lý tài khoản.</Text>}
          />
          <Text size={300}>
            Chúng tôi đang xây dựng kho tài liệu hướng dẫn chi tiết cho từng vai trò. Trong thời gian này,
            bạn có thể liên hệ trực tiếp với ban tổ chức hoặc xem lại các câu hỏi thường gặp dưới đây.
          </Text>
        </Card>

        <Card className={classes.section}>
          <CardHeader
            header={<Text weight="semibold" size={400}>Liên hệ nhanh</Text>}
            description={<Text size={200}>Đội ngũ hỗ trợ sẽ phản hồi trong vòng 1 ngày làm việc.</Text>}
          />
          <Button as="a" href="mailto:support@researchreview.com" appearance="primary" icon={<Mail20Regular />}>
            support@researchreview.com
          </Button>
        </Card>

        <Card className={classes.section}>
          <CardHeader
            header={<Text weight="semibold" size={400}>Tài nguyên</Text>}
            description={<Text size={200}>Đang cập nhật thêm hướng dẫn chi tiết.</Text>}
          />
          <Button appearance="secondary" icon={<Document16Regular />}>
            Quy trình nộp bài (sắp ra mắt)
          </Button>
          <Button appearance="secondary" icon={<Document16Regular />}>
            Quy trình phản biện (sắp ra mắt)
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default HelpCenter
