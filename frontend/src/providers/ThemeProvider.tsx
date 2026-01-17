import { FluentProvider, Toaster, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import { useThemeStore } from '../stores/themeStore.ts'
import { APP_TOASTER_ID } from '../constants/toaster'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((state) => state.theme)
    return (
        <FluentProvider theme={theme === "light" ? webLightTheme : webDarkTheme}>
            <Toaster toasterId={APP_TOASTER_ID} />
            {children}
        </FluentProvider>
    )
}