import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getCurrentLanguage } from '../utils/getCurrentLanguage'

function normalizeLanguage(language: string): 'ru' | 'en' {
  return language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

const initialLanguage = normalizeLanguage(getCurrentLanguage() || 'en')

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        greeting: 'Hello!',
        description: 'Welcome to GroupTube popup.',
      },
    },
    ru: {
      translation: {
        greeting: 'Привет!',
        description: 'Добро пожаловать в popup GroupTube.',
      },
    },
  },
})

export { i18n }
