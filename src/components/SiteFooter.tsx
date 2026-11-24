import { useEffect, useState } from 'react'
import { brand } from '../content/site'
import { useT } from '../lib/i18n'
import { Dialog } from './Dialog'

export function SiteFooter() {
  const t = useT()
  const f = t.footer
  const [doc, setDoc] = useState<string | null>(null)

  useEffect(() => {
    const on = (e: Event) => setDoc((e as CustomEvent<string>).detail)
    window.addEventListener('open-legal', on)
    return () => window.removeEventListener('open-legal', on)
  }, [])

  const current = t.legal.find((l) => l.id === doc)
  const year = new Date().getFullYear()

  return (
    <footer data-nav="light" data-nav-bg="ink" className="on-dark relative z-30 border-t border-ivory/10 bg-ink text-ivory">
      <div className="gutter grid grid-cols-12 gap-x-6 gap-y-12 pb-10 pt-20">
        <div className="col-span-12 md:col-span-5">
          <p className="font-serif text-[clamp(2.4rem,4.5vw,4rem)] font-light leading-none tracking-[-0.02em]">{brand.name}</p>
          <p className="t-label mt-4 text-ivory/55">{t.brandDescriptor}</p>
        </div>
        <nav aria-label={f.aria} className="col-span-6 md:col-span-2 md:col-start-7">
          <p className="t-label mb-4 text-ivory/45">{f.explore}</p>
          <ul className="space-y-2">
            {t.navigation.map((n) => (
              <li key={n.href}>
                <a className="t-caption link-quiet" href={n.href}>{n.label}</a>
              </li>
            ))}
            <li><a className="t-caption link-quiet" href="#consultation">{f.consultation}</a></li>
          </ul>
        </nav>
        <div className="col-span-6 md:col-span-3">
          <p className="t-label mb-4 text-ivory/45">{f.contact}</p>
          <ul className="t-caption space-y-2 text-ivory/80">
            {brand.email && <li dir="ltr" className="text-start"><a className="link-quiet" href={`mailto:${brand.email}`}>{brand.email}</a></li>}
            {brand.phone && <li dir="ltr" className="text-start"><a className="link-quiet" href={`tel:${brand.phone.replace(/\s/g, '')}`}>{brand.phone}</a></li>}
            {brand.address && <li>{brand.address}</li>}
            {!brand.email && !brand.phone && !brand.address && <li className="text-ivory/50">{f.contactPending}</li>}
            <li><a className="link-quiet" href="#enquiry">{f.enquiryForm}</a></li>
          </ul>
        </div>

        <p className="t-caption col-span-12 max-w-2xl text-ivory/50 md:col-span-7">{t.demoNotice}</p>

        <div className="col-span-12 flex flex-wrap items-center justify-between gap-4 border-t border-ivory/10 pt-6">
          <p className="t-caption text-ivory/45">
            © {year} {brand.legalName || brand.name}
          </p>
          <ul className="flex flex-wrap gap-6">
            {t.legal.map((l) => (
              <li key={l.id}>
                <button type="button" className="t-caption link-quiet text-ivory/70" onClick={() => setDoc(l.id)}>
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Dialog open={!!current} onClose={() => setDoc(null)} label={current?.label ?? f.legal}>
        {current && (
          <div className="pt-6">
            <p className="t-label text-bronze">{f.legal}</p>
            <h2 className="t-h2 mt-3">{current.label}</h2>
            <p className="t-body mt-6 text-ink/80">{f.legalPending(current.label)}</p>
          </div>
        )}
      </Dialog>
    </footer>
  )
}
