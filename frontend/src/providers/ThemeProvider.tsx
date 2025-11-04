
import { FluentProvider, Toaster, useId, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import { useThemeStore } from '../stores/themeStore.ts'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((state) => state.theme)
    const toasterId = useId('toaster')
    return (
        <FluentProvider theme={theme === "light" ? webLightTheme : webDarkTheme}>
            <Toaster id={toasterId} />
            {children}
        </FluentProvider>
    )
}