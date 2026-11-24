import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Project } from '../content/site'
import { useT } from '../lib/i18n'
import { useEngine, useStill } from '../lib/engine'
import { gsap } from '../lib/gsap'
import { Dialog } from './Dialog'

/** Uneven placement: varied proportions, offsets and whitespace rather than a card grid. */
const layout = [
  { col: 'md:col-span-7', ratio: '4 / 3', offset: '' },
  { col: 'md:col-span-4 md:col-start-9', ratio: '3 / 4', offset: 'md:mt-48' },
  { col: 'md:col-span-5 md:col-start-2', ratio: '1 / 1', offset: 'md:-mt-24' },
  { col: 'md:col-span-6 md:col-start-7', ratio: '16 / 11', offset: 'md:mt-16' },
]

/**
 * Section I — Completed projects.
 * Until real projects are supplied, entries are clearly labelled demonstration
 * placeholders illustrated with abstract massing models, never photographs.
 */
export function ProjectPortfolio() {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<Project | null>(null)
  const { reduced } = useEngine()
  const t = useT()
  const s = t.projectsSection

  useEffect(() => {
    if (reduced || !ref.current) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-project]').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
    }, ref)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="projects" ref={ref} data-nav="dark" data-nav-bg="limestone" className="relative z-30 bg-limestone py-28 md:py-40" aria-labelledby="projects-title">
      <div className="gutter">
        <header className="grid grid-cols-12 gap-x-6 gap-y-6 border-t border-ink/20 pt-6">
          <p className="t-label col-span-12 text-umber md:col-span-3">
            <span className="text-bronze">I</span> — {s.label}
          </p>
          <h2 id="projects-title" className="t-h1 col-span-12 md:col-span-5">
            {s.title}
          </h2>
          <p className="t-caption col-span-12 max-w-sm self-end text-umber md:col-span-4">
            {s.note}
          </p>
        </header>

        <ul className="mt-20 grid grid-cols-1 gap-x-6 gap-y-20 md:mt-28 md:grid-cols-12 md:gap-y-10">
          {t.projects.map((p, i) => (
            <ProjectItem key={p.id} p={p} i={i} onOpen={() => setOpen(p)} />
          ))}
        </ul>
      </div>

      <Dialog open={!!open} onClose={() => setOpen(null)} label={open ? s.dialogLabel(open.name) : s.dialogFallback} wide>
        {open && <ProjectDetail p={open} />}
      </Dialog>
    </section>
  )
}

function useMassing(p: Project, near?: RefObject<Element | null>) {
  const { mobile } = useEngine()
  const s = mobile ? 0.6 : 1
  return useStill(`massing-${p.variant}-${mobile}`, () => ({ kind: 'massing', variant: p.variant, width: Math.round(1400 * s), height: Math.round(1100 * s) }), near)
}

function ProjectItem({ p, i, onOpen }: { p: Project; i: number; onOpen: () => void }) {
  const t = useT()
  const s = t.projectsSection
  const li = useRef<HTMLLIElement>(null)
  const url = useMassing(p, li)
  const l = layout[i % layout.length]
  return (
    <li ref={li} data-project className={`${l.col} ${l.offset}`}>
      <button type="button" onClick={onOpen} className="group block w-full text-start" aria-haspopup="dialog">
        <div className="relative overflow-hidden bg-stone" style={{ aspectRatio: l.ratio }}>
          {url && (
            <img
              src={url}
              alt={s.altCard(p.name)}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-[var(--ease-arch)] group-hover:scale-[1.035]"
            />
          )}
          <span className="t-label absolute start-4 top-4 bg-ivory/90 px-2 py-1 text-ink">{p.status}</span>
        </div>
        <div className="mt-5 flex items-baseline justify-between gap-6 border-b border-ink/15 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="t-label text-bronze">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="t-h3">
              <span className="link-quiet">{p.name}</span>
            </h3>
          </div>
          <span className="t-label shrink-0 text-umber transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden>
            {s.view} {t.ui.arrow}
          </span>
        </div>
        <dl className="t-caption mt-3 flex flex-wrap gap-x-6 gap-y-1 text-ink/70">
          <div className="flex gap-2"><dt className="sr-only">{s.category}</dt><dd>{p.category}</dd></div>
          <div className="flex gap-2"><dt className="sr-only">{s.location}</dt><dd>{p.location || s.locationMissing}</dd></div>
        </dl>
      </button>
    </li>
  )
}

function ProjectDetail({ p }: { p: Project }) {
  const url = useMassing(p)
  const s = useT().projectsSection
  return (
    <div className="grid gap-8 pt-8 md:grid-cols-12">
      <div className="md:col-span-7">
        <div className="relative overflow-hidden bg-stone" style={{ aspectRatio: '14 / 11' }}>
          {url && <img src={url} alt={s.altDetail(p.name)} className="absolute inset-0 h-full w-full object-cover" />}
        </div>
      </div>
      <div className="md:col-span-5">
        <p className="t-label text-bronze">{p.status}</p>
        <h3 className="t-h2 mt-4">{p.name}</h3>
        <dl className="mt-8 border-t border-ink/15">
          {[
            [s.category, p.category],
            [s.location, p.location || s.notSupplied],
            [s.status, p.status],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 border-b border-ink/15 py-3">
              <dt className="t-label text-umber">{k}</dt>
              <dd className="t-caption text-end">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="t-body mt-6 text-ink/80">{p.summary}</p>
      </div>
    </div>
  )
}
