import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { brand } from '../content/site'
import type { Content } from '../content/en'
import { useEngine, useStill } from '../lib/engine'
import { useT } from '../lib/i18n'
import { gsap } from '../lib/gsap'

type Values = { name: string; email: string; phone: string; type: string; location: string; timeline: string; message: string; consent: boolean }
type Errors = Partial<Record<keyof Values, string>>
type Status = 'idle' | 'sending' | 'sent' | 'mail' | 'unconfigured' | 'failed'

const empty: Values = { name: '', email: '', phone: '', type: '', location: '', timeline: '', message: '', consent: false }

function validate(v: Values, msg: Content['consultation']['errors']): Errors {
  const e: Errors = {}
  if (!v.name.trim()) e.name = msg.name
  if (!v.email.trim()) e.email = msg.email
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = msg.emailInvalid
  if (!v.message.trim()) e.message = msg.message
  if (!v.consent) e.consent = msg.consent
  return e
}

export const openLegal = (id: string) => window.dispatchEvent(new CustomEvent('open-legal', { detail: id }))

/**
 * Section J — Final consultation.
 * A dusk view of the villa from the forecourt, one statement, one primary action,
 * and a working enquiry form below it.
 */
export function ConsultationSection() {
  const { mobile, reduced } = useEngine()
  const t = useT()
  const c = t.consultation
  const s = mobile ? 0.55 : 1
  const ref = useRef<HTMLElement>(null)
  const url = useStill(`consult-${mobile}`, () => ({
    kind: 'villa',
    pose: { pos: [-11, 1.25, 21], look: [-3, 4.4, 3], fov: 40, exp: 1.2 },
    state: { dusk: 1 },
    width: Math.round(1920 * s),
    height: Math.round(1100 * s),
  }), ref)

  useEffect(() => {
    if (reduced || !ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-consult-img]', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-consult-hero]', start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.fromTo('[data-consult-line]', { yPercent: 105 }, { yPercent: 0, duration: 1.3, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '[data-consult-hero]', start: 'top 45%' } })
    }, ref)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="consultation" ref={ref} className="on-dark relative z-30 bg-ink text-ivory" aria-labelledby="consult-title">
      <div data-consult-hero data-nav="light" className="relative flex min-h-[100svh] items-end overflow-hidden">
        <div data-consult-img className="absolute inset-0 bg-charcoal">
          {url && <img src={url} alt={c.heroAlt} className="h-full w-full object-cover" loading="lazy" />}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,21,19,0)_35%,rgba(23,21,19,0.78)_100%)]" />
        </div>
        <div className="gutter relative w-full pb-16 md:pb-24">
          <p className="t-label mb-8 text-ivory/70">
            <span className="text-bronze-light">J</span> — {c.label}
          </p>
          <h2 id="consult-title" className="t-display max-w-[14ch]">
            {c.headline.map((l, i) => (
              <span key={i} className="block overflow-hidden pb-[0.06em]">
                <span data-consult-line className={`block ${i === 1 ? 'italic-serif ps-[0.8em]' : ''}`}>
                  {l}
                </span>
              </span>
            ))}
          </h2>
          <div className="mt-10 grid grid-cols-12 items-end gap-6">
            <p className="t-lede col-span-12 max-w-md text-ivory/80 md:col-span-6">{c.approach}</p>
            <div className="col-span-12 md:col-span-6 md:text-end">
              <a href="#enquiry" className="btn-primary">
                {c.cta} <span className="arrow" aria-hidden>{t.ui.arrow}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <EnquiryForm />
    </section>
  )
}

function EnquiryForm() {
  const t = useT()
  const c = t.consultation
  const [v, setV] = useState<Values>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const id = useId()
  const statusRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((p) => ({ ...p, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(v, c.errors)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const f = c.fields
    const lines = [
      `${f.name}: ${v.name}`,
      `${f.email}: ${v.email}`,
      v.phone && `${f.phone}: ${v.phone}`,
      v.type && `${f.type}: ${v.type}`,
      v.location && `${f.location}: ${v.location}`,
      v.timeline && `${f.timeline}: ${v.timeline}`,
      '',
      v.message,
    ].filter((l): l is string => typeof l === 'string')

    if (brand.enquiryEndpoint) {
      setStatus('sending')
      try {
        const res = await fetch(brand.enquiryEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
        setStatus(res.ok ? 'sent' : 'failed')
        if (res.ok) setV(empty)
      } catch {
        setStatus('failed')
      }
    } else if (brand.email) {
      const href = `mailto:${brand.email}?subject=${encodeURIComponent(c.mailSubject(v.name))}&body=${encodeURIComponent(lines.join('\n'))}`
      window.location.href = href
      setStatus('mail')
    } else {
      console.info('[enquiry] No endpoint or email configured in src/content/site.ts; enquiry not sent.')
      setStatus('unconfigured')
    }
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  const err = (k: keyof Values) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className="t-caption mt-2 text-[#e7a98d]">
        {errors[k]}
      </p>
    ) : null
  const a = (k: keyof Values) => ({
    id: `${id}-${k}`,
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${id}-${k}-err` : undefined,
  })

  return (
    <div id="enquiry" data-nav="light" data-nav-bg="ink" className="gutter grid scroll-mt-[var(--nav-h)] grid-cols-12 gap-x-6 gap-y-14 py-24 md:py-32">
      <div className="col-span-12 md:col-span-4">
        <h3 className="t-h2">
          {c.formTitle[0]}
          <br />
          <span className="italic-serif">{c.formTitle[1]}</span>
        </h3>
        <p className="t-body mt-6 max-w-sm text-ivory/70">{c.formIntro}</p>
        <ContactList />
      </div>

      <form onSubmit={submit} noValidate className="col-span-12 grid grid-cols-2 gap-x-8 gap-y-9 md:col-span-7 md:col-start-6" aria-describedby={`${id}-req`}>
        <p id={`${id}-req`} className="t-caption col-span-2 text-ivory/55">
          {c.required}
        </p>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-name`} className="t-label text-ivory/70">{c.fields.name} *</label>
          <input {...a('name')} className="field" autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} />
          {err('name')}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-email`} className="t-label text-ivory/70">{c.fields.email} *</label>
          {/* Addresses and numbers are always written left to right, even on the Arabic site. */}
          <input {...a('email')} type="email" dir="ltr" className="field text-start" autoComplete="email" inputMode="email" value={v.email} onChange={(e) => set('email', e.target.value)} />
          {err('email')}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-phone`} className="t-label text-ivory/70">{c.fields.phone}</label>
          <input {...a('phone')} type="tel" dir="ltr" className="field" autoComplete="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-location`} className="t-label text-ivory/70">{c.fields.location}</label>
          <input {...a('location')} className="field" placeholder={c.fields.locationPlaceholder} value={v.location} onChange={(e) => set('location', e.target.value)} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-type`} className="t-label text-ivory/70">{c.fields.type}</label>
          <select {...a('type')} className="field" value={v.type} onChange={(e) => set('type', e.target.value)}>
            <option value="">{c.fields.select}</option>
            {c.projectTypes.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-timeline`} className="t-label text-ivory/70">{c.fields.timeline}</label>
          <select {...a('timeline')} className="field" value={v.timeline} onChange={(e) => set('timeline', e.target.value)}>
            <option value="">{c.fields.select}</option>
            {c.timelines.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label htmlFor={`${id}-message`} className="t-label text-ivory/70">{c.fields.message} *</label>
          <textarea {...a('message')} rows={4} className="field resize-y" value={v.message} onChange={(e) => set('message', e.target.value)} />
          {err('message')}
        </div>
        <div className="col-span-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              {...a('consent')}
              type="checkbox"
              checked={v.consent}
              onChange={(e) => set('consent', e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-bronze-light)]"
              aria-labelledby={`${id}-consent-label`}
            />
            <span id={`${id}-consent-label`} className="t-caption text-ivory/75">
              {c.consent.before}{' '}
              <button type="button" className="underline underline-offset-2" onClick={() => openLegal('privacy')}>
                {c.consent.link}
              </button>
              {c.consent.after} *
            </span>
          </label>
          {err('consent')}
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-6">
          <button type="submit" className="btn-primary" disabled={status === 'sending'}>
            {status === 'sending' ? c.sending : c.send} <span className="arrow" aria-hidden>{t.ui.arrow}</span>
          </button>
          {brand.whatsapp && (
            <a
              className="t-label link-quiet pb-1"
              href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(c.whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.whatsapp}
            </a>
          )}
        </div>
        <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="col-span-2 outline-none">
          {status !== 'idle' && status !== 'sending' && (
            <p className={`t-body max-w-lg border-s ps-4 ${status === 'failed' || status === 'unconfigured' ? 'border-[#e7a98d]' : 'border-bronze-light'}`}>{c.status[status]}</p>
          )}
        </div>
      </form>
    </div>
  )
}

function ContactList() {
  const c = useT().consultation
  const items = [
    brand.email && { k: c.contactLabels.email, v: brand.email, href: `mailto:${brand.email}` },
    brand.phone && { k: c.contactLabels.phone, v: brand.phone, href: `tel:${brand.phone.replace(/\s/g, '')}` },
    brand.address && { k: c.contactLabels.address, v: brand.address },
  ].filter(Boolean) as { k: string; v: string; href?: string }[]
  if (!items.length) {
    return <p className="t-caption mt-10 max-w-xs border-t border-ivory/15 pt-4 text-ivory/50">{c.contactPending}</p>
  }
  return (
    <dl className="mt-10 border-t border-ivory/15">
      {items.map((i) => (
        <div key={i.k} className="flex justify-between gap-4 border-b border-ivory/15 py-3">
          <dt className="t-label text-ivory/55">{i.k}</dt>
          <dd className="t-caption text-end" dir="ltr">{i.href ? <a className="link-quiet" href={i.href}>{i.v}</a> : i.v}</dd>
        </div>
      ))}
    </dl>
  )
}
