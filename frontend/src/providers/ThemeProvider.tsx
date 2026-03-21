import { FluentProvider, Toaster, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd'
import { useThemeStore } from '../stores/themeStore.ts'
import { APP_TOASTER_ID } from '../constants/toaster'

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
                <FluentProvider theme={theme === "light" ? webLightTheme : webDarkTheme}>
                    <Toaster toasterId={APP_TOASTER_ID} />
                    {children}
                </FluentProvider>
            </AntApp>
        </ConfigProvider>
    )
}