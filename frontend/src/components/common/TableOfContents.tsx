import { makeStyles, Text, tokens, Button } from '@fluentui/react-components'
import { DocumentBulletListRegular, DismissRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
    root: {
        width: '280px',
        height: '100%',
        flexShrink: 0,
        borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: 'hidden',
    },
    header: {
        padding: '16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    list: {
        flex: 1,
        overflow: 'auto',
        padding: '8px',
        minHeight: 0,
    },
    item: {
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: '4px',
        marginBottom: '4px',
        transition: 'background-color 0.2s',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    itemNested: {
        marginLeft: '16px',
        fontSize: '13px',
    },
    itemTitle: {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    itemPage: {
        flexShrink: 0,
        color: tokens.colorNeutralForeground3,
    },
    emptyState: {
        padding: '16px',
        color: tokens.colorNeutralForeground3,
        textAlign: 'center',
    },
})

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
    const classes = useStyles()

    // Render TOC items recursively
    const renderTocItems = (tocItems: TocItem[], level: number = 0): React.ReactElement[] => {
        return tocItems.map((item, index) => (
            <div key={`${item.pageNumber}-${index}`}>
                <div
                    className={`${classes.item} ${level > 0 ? classes.itemNested : ''}`}
                    onClick={() => onItemClick?.(item.pageNumber)}
                    style={{ paddingLeft: `${12 + level * 12}px` }}
                >
                    <Text size={level === 0 ? 300 : 200} className={classes.itemTitle}>
                        {item.title}
                    </Text>
                    <Text size={200} className={classes.itemPage}>
                        {item.pageNumber}
                    </Text>
                </div>
                {item.items && renderTocItems(item.items, level + 1)}
            </div>
        ))
    }

    return (
        <div className={classes.root}>
            <div className={classes.header}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DocumentBulletListRegular style={{ marginRight: '8px' }} />
                    <Text weight="semibold" size={400}>
                        Mục lục
                    </Text>
                </div>
                {onClose && (
                    <Button
                        appearance="subtle"
                        size="small"
                        icon={<DismissRegular />}
                        onClick={onClose}
                        title="Đóng mục lục"
                    />
                )}
            </div>
            <div className={classes.list}>
                {items.length > 0 ? (
                    renderTocItems(items)
                ) : (
                    <Text className={classes.emptyState}>
                        {emptyMessage}
                    </Text>
                )}
            </div>
        </div>
    )
}
