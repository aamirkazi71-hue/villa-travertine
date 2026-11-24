import { useEffect, useRef, useState } from 'react'
import { brand } from '../content/site'
import { useI18n } from '../lib/i18n'

/**
 * Restrained fixed navigation. Its colour follows whatever section sits beneath
 * it (sections declare `data-nav="dark|light"` for the ink colour they need).
 */
export function SiteNavigation() {
  const { t } = useI18n()
  const navigation = t.navigation
  const [tone, setTone] = useState<'dark' | 'light'>('dark')
  const [bg, setBg] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const probe = 36
      const sections = Array.from(document.querySelectorAll<HTMLElement>('main [data-nav], footer[data-nav]'))
      let t: 'dark' | 'light' = 'dark'
      let best: HTMLElement | null = null
      for (const s of sections) {
        const r = s.getBoundingClientRect()
        if (r.top <= probe && r.bottom > probe) {
          // Deepest match wins, so nested regions can override their parent.
          if (!best || best.contains(s)) best = s
        }
      }
      if (best) t = best.dataset.nav === 'light' ? 'light' : 'dark'
      setTone(t)
      // Over opaque editorial sections the bar takes the section colour; over the 3D stage it stays clear.
      let b = ''
      for (let el: HTMLElement | null = best; el; el = el.parentElement?.closest<HTMLElement>('[data-nav]') ?? null) {
        if (el.dataset.navBg) {
          b = el.dataset.navBg
          break
        }
      }
      setBg(b)
      const mid = window.innerHeight * 0.4
      let a = ''
      for (const n of navigation) {
        const el = document.querySelector(n.href)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= mid && r.bottom > mid) a = n.href
      }
      setActive(a)
    }
    // (navigation hrefs are the same in every language)
    const on = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    const mo = new MutationObserver(on)
    mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-nav'] })
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      mo.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  // Mobile menu: Escape closes, focus moves in and returns to the toggle.
  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', key)
      document.body.style.overflow = ''
    }
  }, [open])

  const ink = open ? 'text-ivory' : tone === 'light' ? 'text-ivory' : 'text-ink'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[color,background-color,border-color] duration-500 ${ink} ${bg && !open ? 'border-current/10' : 'border-transparent'}`}
      style={{ backgroundColor: bg && !open ? `var(--color-${bg})` : 'transparent' }}
    >
      <div className="gutter flex h-[var(--nav-h)] items-center justify-between">
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-baseline gap-3" aria-label={t.ui.backToTop(brand.name)}>
          <span className="font-serif text-[1.45rem] leading-none tracking-[-0.01em]">{brand.name}</span>
          <span className="t-label hidden opacity-60 lg:inline">{t.brandDescriptor}</span>
        </a>

        <nav aria-label={t.ui.navPrimary} className="hidden md:block">
          <ul className="flex items-center gap-8">
            {navigation.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="t-label link-quiet pb-1" aria-current={active === n.href ? 'true' : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <LangSwitch />
            </li>
            <li>
              <a href="#consultation" className={`t-label border px-4 py-2.5 transition-colors duration-300 ${tone === 'light' ? 'border-ivory/50 hover:bg-ivory hover:text-ink' : 'border-ink/40 hover:bg-ink hover:text-ivory'}`}>
                {t.ui.enquire}
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <LangSwitch />
        <button
          ref={buttonRef}
          type="button"
          className="t-label -me-2 p-2"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? t.ui.close : t.ui.menu}
        </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={menuRef}
        hidden={!open}
        className="fixed inset-0 top-0 -z-10 bg-ink text-ivory on-dark md:hidden"
      >
        <nav aria-label={t.ui.navMobile} className="gutter flex h-full flex-col justify-end pb-12 pt-24">
          <ul className="space-y-2">
            {navigation.map((n, i) => (
              <li key={n.href} className="flex items-baseline gap-4 border-b border-ivory/15 py-3">
                <span className="t-label text-bronze-light">0{i + 1}</span>
                <a href={n.href} onClick={() => setOpen(false)} className="t-h2">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#consultation" onClick={() => setOpen(false)} className="btn-primary mt-10 self-start">
            {t.consultation.cta} <span className="arrow" aria-hidden>{t.ui.arrow}</span>
          </a>
        </nav>
      </div>
    </header>
  )
}

/** Switches between English and Arabic; labelled in the language it switches to. */
function LangSwitch() {
  const { t, setLocale } = useI18n()
  const l = t.ui.language
  return (
    <button type="button" lang={l.lang} onClick={() => setLocale(l.lang)} aria-label={l.aria} className="t-label link-quiet p-2 pb-1">
      {l.label}
    </button>
  )
}
