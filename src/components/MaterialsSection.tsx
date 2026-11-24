import { useEffect, useRef } from 'react'
import type { Material } from '../content/site'
import { useT } from '../lib/i18n'
import { useEngine, useStill } from '../lib/engine'
import { gsap } from '../lib/gsap'

/** Placement of each sample on the 12-column grid: deliberately uneven. */
const layout: Record<Material['key'], { col: string; ratio: string; offset: string }> = {
  limestone: { col: 'md:col-span-5 md:col-start-1', ratio: '4 / 5', offset: '' },
  travertine: { col: 'md:col-span-6 md:col-start-7', ratio: '1 / 1', offset: 'md:mt-40' },
  oak: { col: 'md:col-span-4 md:col-start-2', ratio: '3 / 4', offset: 'md:-mt-8' },
  walnut: { col: 'md:col-span-4 md:col-start-7', ratio: '4 / 5', offset: 'md:mt-44' },
  bronze: { col: 'md:col-span-6 md:col-start-1', ratio: '5 / 4', offset: 'md:-mt-4' },
  glass: { col: 'md:col-span-5 md:col-start-8', ratio: '4 / 5', offset: 'md:mt-28' },
}

/**
 * Section F — Materials and craftsmanship.
 * Each sample is a still rendered from the same material definitions the villa
 * uses, lit from a low angle so texture reads.
 */
export function MaterialsSection() {
  const ref = useRef<HTMLElement>(null)
  const { reduced } = useEngine()
  const t = useT()
  const s = t.materialsSection

  useEffect(() => {
    if (reduced || !ref.current) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-sample]').forEach((el) => {
        const img = el.querySelector('[data-sample-img]')
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } })
        tl.fromTo(el.querySelector('[data-mask]'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' })
        if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.9, ease: 'power3.out' }, 0)
        tl.fromTo(el.querySelectorAll('[data-copy]'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.6)
      })
      gsap.fromTo('[data-mat-head] [data-line]', { yPercent: 105 }, { yPercent: 0, duration: 1.2, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '[data-mat-head]', start: 'top 80%' } })
    }, ref)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="materials" ref={ref} data-nav="dark" data-nav-bg="ivory" className="relative z-30 bg-ivory py-28 md:py-40" aria-labelledby="materials-title">
      <div className="gutter">
        <header data-mat-head className="grid grid-cols-12 gap-x-6 gap-y-8 border-t border-ink/20 pt-6">
          <p className="t-label col-span-12 text-umber md:col-span-3">
            <span className="text-bronze">F</span> — {s.label}
          </p>
          <h2 id="materials-title" className="t-h1 col-span-12 md:col-span-6">
            <span className="block overflow-hidden pb-[0.06em]"><span data-line className="block">{s.title[0]}</span></span>
            <span className="block overflow-hidden pb-[0.06em]"><span data-line className="italic-serif block ps-[1.2em]">{s.title[1]}</span></span>
          </h2>
          <p className="t-lede col-span-12 text-ink/75 md:col-span-3 md:pt-3">
            {s.lede}
          </p>
        </header>

        <div className="mt-20 grid grid-cols-1 gap-x-6 gap-y-16 md:mt-28 md:grid-cols-12 md:gap-y-12">
          {t.materials.map((m, i) => (
            <Sample key={m.key} m={m} i={i} />
          ))}
        </div>

        <p className="t-caption mt-24 max-w-md text-umber">
          {s.caption}
        </p>
      </div>
    </section>
  )
}

function Sample({ m, i }: { m: Material; i: number }) {
  const { mobile } = useEngine()
  const t = useT()
  const s = mobile ? 0.6 : 1
  const fig = useRef<HTMLElement>(null)
  const url = useStill(`material-${m.key}-${mobile}`, () => ({ kind: 'material', key: m.key, width: Math.round(900 * s), height: Math.round(1100 * s) }), fig)
  const l = layout[m.key]
  return (
    <figure ref={fig} data-sample className={`${l.col} ${l.offset}`}>
      <div data-mask className="relative overflow-hidden bg-limestone" style={{ aspectRatio: l.ratio }}>
        <div data-sample-img className="absolute inset-0">
          {url && <img src={url} alt={t.materialsSection.alt(m.name)} className="h-full w-full object-cover" loading="lazy" />}
        </div>
      </div>
      <figcaption className="mt-5 grid grid-cols-[auto_1fr] gap-x-5">
        <span className="t-num row-span-3 text-[2.4rem] leading-none text-bronze" data-copy>
          {String(i + 1).padStart(2, '0')}
        </span>
        <h3 className="t-h3" data-copy>{m.name}</h3>
        <p className="t-label mt-2 text-umber" data-copy>{m.where}</p>
        <p className="t-body mt-3 max-w-[30rem] text-ink/80" data-copy>{m.why}</p>
      </figcaption>
    </figure>
  )
}
