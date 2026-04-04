import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import viCommon from './locales/vi/common.json'

const LANGUAGE_STORAGE_KEY = 'app.locale'

const resources = {
  en: {
    common: enCommon,
  },
  vi: {
    common: viCommon,
  },
}

const normalizeLanguage = (value: string | null | undefined): 'vi' | 'en' => {
  if (!value) {
    return 'vi'
  }

  const locale = value.toLowerCase()
  if (locale.startsWith('vi')) {
    return 'vi'
  }

  return 'en'
}

const detected = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? navigator.language)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: detected,
    fallbackLng: 'vi',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

export const appLocaleStorageKey = LANGUAGE_STORAGE_KEY

export const getAppLocale = (): 'vi' | 'en' => normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? i18n.language)

export const setAppLocale = async (locale: 'vi' | 'en'): Promise<void> => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, locale)
  await i18n.changeLanguage(locale)
}

export default i18n
