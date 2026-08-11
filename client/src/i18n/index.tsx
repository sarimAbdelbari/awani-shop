import React, { createContext, useContext, useState } from 'react'
import fr from './locales/fr.json'
import en from './locales/en.json'

type Locale = 'fr' | 'en'
type LocaleData = typeof fr

const locales: Record<Locale, LocaleData> = { fr, en }

interface I18nContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (k) => k,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem('aw_locale') as Locale | null
    return stored === 'en' ? 'en' : 'fr'
  })

  const handleSetLocale = (l: Locale) => {
    localStorage.setItem('aw_locale', l)
    setLocale(l)
  }

  const t = (key: string): string => {
    const parts = key.split('.')
    let val: unknown = locales[locale]
    for (const part of parts) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[part]
      } else {
        return key
      }
    }
    return typeof val === 'string' ? val : key
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
