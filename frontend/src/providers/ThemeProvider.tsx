import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd'
import { useThemeStore } from '../stores/themeStore.ts'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((state) => state.theme)
    return (
        <ConfigProvider
            theme={{
                algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                    borderRadius: 8,
                },
            }}
        >
            <AntApp>
                {children}
            </AntApp>
        </ConfigProvider>
    )
}