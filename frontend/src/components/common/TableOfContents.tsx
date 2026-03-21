import { Typography, Button } from 'antd'
import { FileOutlined, CloseOutlined } from '@ant-design/icons'

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

export function TableOfContents({ items, onItemClick, onClose, emptyMessage = 'Không có mục lục' }: TableOfContentsProps) {
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
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Text ellipsis style={{ flex: 1, fontSize: level === 0 ? '14px' : '13px' }}>
                        {item.title}
                    </Text>
                    <Text style={{ flexShrink: 0, fontSize: '13px', color: '#666' }}>
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
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fafafa',
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f5',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FileOutlined style={{ marginRight: '8px' }} />
                    <Text strong style={{ fontSize: '14px' }}>
                        Mục lục
                    </Text>
                </div>
                {onClose && (
                    <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        title="Đóng mục lục"
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
                        color: '#999',
                        textAlign: 'center',
                        display: 'block',
                    }}>
                        {emptyMessage}
                    </Text>
                )}
            </div>
        </div>
    )
}
