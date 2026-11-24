import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type Content } from '../content/en'
import { ar } from '../content/ar'
import type { Locale } from '../content/types'
import { ScrollTrigger } from './gsap'

const dictionaries: Record<Locale, Content> = { en, ar }
const KEY = 'villa:lang'

/** A shared link wins (`?lang=ar`), then the visitor's last choice, then their browser language. */
function initialLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch {
    // Storage can be unavailable (private mode); fall through.
  }
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

type I18n = { locale: Locale; dir: 'ltr' | 'rtl'; t: Content; setLocale: (l: Locale) => void }

const I18nContext = createContext<I18n>({ locale: 'en', dir: 'ltr', t: en, setLocale: () => {} })
export const useI18n = () => useContext(I18nContext)
/** The current language's content dictionary. */
export const useT = () => useContext(I18nContext).t

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const t = dictionaries[locale]
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const html = document.documentElement
    html.lang = locale
    html.dir = dir
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
    // Text length and line breaks change between languages, so scroll positions must be remeasured.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [locale, dir, t])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
      // Not critical.
    }
    // Keep the address shareable without reloading the page.
    const url = new URL(window.location.href)
    if (l === 'en') url.searchParams.delete('lang')
    else url.searchParams.set('lang', l)
    window.history.replaceState(null, '', url)
  }, [])

  const value = useMemo(() => ({ locale, dir, t, setLocale }) as I18n, [locale, dir, t, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
