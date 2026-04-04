import { Typography, Button, theme as antdTheme } from 'antd'
import { FileOutlined, CloseOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

export interface TocItem {
    title: string
    pageNumber: number
    items?: TocItem[]
}

interface TableOfContentsProps {
    items: TocItem[]
    onItemClick?: (pageNumber: number) => void
    onClose?: () => void
    emptyMessage?: string
}

export function TableOfContents({ items, onItemClick, onClose, emptyMessage }: TableOfContentsProps) {
    const { t } = useTranslation('common')
    const { token } = antdTheme.useToken()
    const resolvedEmptyMessage = emptyMessage ?? t('toc.empty')
    // Render TOC items recursively
    const renderTocItems = (tocItems: TocItem[], level: number = 0): React.ReactElement[] => {
        return tocItems.map((item, index) => (
            <div key={`${item.pageNumber}-${index}`}>
                <div
                    onClick={() => onItemClick?.(item.pageNumber)}
                    style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        paddingLeft: `${12 + level * 12}px`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = token.colorFillSecondary)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Text ellipsis style={{ flex: 1, fontSize: level === 0 ? '14px' : '13px' }}>
                        {item.title}
                    </Text>
                    <Text style={{ flexShrink: 0, fontSize: '13px', color: token.colorTextSecondary }}>
                        {item.pageNumber}
                    </Text>
                </div>
                {item.items && renderTocItems(item.items, level + 1)}
            </div>
        ))
    }

    return (
        <div style={{
            width: '280px',
            height: '100%',
            flexShrink: 0,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: token.colorBgContainer,
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '16px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                backgroundColor: token.colorBgLayout,
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FileOutlined style={{ marginRight: '8px' }} />
                    <Text strong style={{ fontSize: '14px' }}>
                        {t('toc.title')}
                    </Text>
                </div>
                {onClose && (
                    <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        title={t('toc.close')}
                    />
                )}
            </div>
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '8px',
                minHeight: 0,
            }}>
                {items.length > 0 ? (
                    renderTocItems(items)
                ) : (
                    <Text style={{
                        padding: '16px',
                        color: token.colorTextSecondary,
                        textAlign: 'center',
                        display: 'block',
                    }}>
                        {resolvedEmptyMessage}
                    </Text>
                )}
            </div>
        </div>
    )
}
