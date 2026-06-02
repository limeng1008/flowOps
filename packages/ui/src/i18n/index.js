import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zh from './locales/zh.json'

export const SUPPORTED_LANGUAGES = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' }
]

export const DEFAULT_LANGUAGE = 'zh'

const savedLanguage = localStorage.getItem('language') || DEFAULT_LANGUAGE

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        zh: { translation: zh }
    },
    lng: savedLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
        escapeValue: false
    },
    returnNull: false
})

export default i18n
