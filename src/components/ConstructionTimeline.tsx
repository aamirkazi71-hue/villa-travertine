import { useEffect, useRef, useState } from 'react'
import type { Stage } from '../content/site'
import { useT } from '../lib/i18n'
import { useEngine, useStill } from '../lib/engine'
import { gsap, ScrollTrigger } from '../lib/gsap'
import type { Layer } from '../scene/villa'
import type { PlainPose, StillSpec } from '../scene/engine'

const STRUCTURE: Layer[] = ['site', 'foundation', 'gfFloor', 'gfStructure', 'ffSlab', 'ffFloor', 'ffStructure', 'roof']
const ENVELOPE: Layer[] = [...STRUCTURE, 'gfSkin', 'gfGlazing', 'ffSkin', 'ffGlazing']

const aerial: PlainPose = { pos: [27, 21, 29], look: [-1, 2.2, 0], fov: 30, exp: 1.0 }

/** Each stage is the same model with only the layers that exist at that point. */
function stageSpec(key: string, s: number): StillSpec {
  const size = { width: Math.round(1400 * s), height: Math.round(1050 * s) }
  switch (key) {
    case 'planning':
      return { kind: 'villa', pose: aerial, layers: ['site', 'setout', 'gfStructure', 'gfSkin', 'ffStructure', 'ffSkin', 'ffSlab', 'roof'], clay: true, ground: 'clay', ...size }
    case 'site':
      return { kind: 'villa', pose: aerial, layers: ['site', 'setout', 'foundation'], clay: 'concrete', ground: 'soil', ...size }
    case 'structure':
      return { kind: 'villa', pose: aerial, layers: STRUCTURE, clay: 'concrete', ground: 'soil', ...size }
    case 'envelope':
      return { kind: 'villa', pose: aerial, layers: ENVELOPE, ground: 'soil', ...size }
    case 'interiors':
      return {
        kind: 'villa',
        pose: { pos: [9, 27, -15], look: [1.5, 3.5, -1.5], fov: 36, exp: 1.05 },
        layers: ['site', 'foundation', 'gfFloor', 'gfStructure', 'gfSkin', 'gfGlazing', 'ffSlab', 'ffFloor', 'ffStructure', 'ffSkin', 'ffGlazing', 'interior', 'landscape', 'trees'],
        ...size,
      }
    default:
      return {
        kind: 'villa',
        pose: { pos: [-26, 6.5, -30], look: [-2, 3.2, -3], fov: 34, exp: 1.08 },
        state: { dusk: 0.55 },
        ...size,
      }
  }
}

/**
 * Section H — The construction process, as an editorial timeline.
 * A sticky index on the left tracks the stage currently in view.
 */
export function ConstructionTimeline() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { reduced } = useEngine()
  const t = useT()
  const stages = t.stages

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-stage]').forEach((s, i) => {
        ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => st.isActive && setActive(i) })
        if (reduced) return
        gsap.fromTo(
          s.querySelector('[data-mask]'),
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: s, start: 'top 80%' } },
        )
      })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="process" ref={ref} data-nav="light" data-nav-bg="charcoal" className="on-dark relative z-30 bg-charcoal py-28 text-ivory md:py-40" aria-labelledby="process-title">
      <div className="gutter grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-4">
          <div className="md:sticky md:top-[calc(var(--nav-h)+2rem)]">
            <p className="t-label border-t border-ivory/20 pt-6 text-ivory/60">
              <span className="text-bronze-light">H</span> — {t.processSection.label}
            </p>
            <h2 id="process-title" className="t-h1 mt-8">
              {t.processSection.title[0]}
              <br />
              <span className="italic-serif">{t.processSection.title[1]}</span>
            </h2>
            <div className="mt-12 hidden items-end gap-5 md:flex" aria-hidden>
              <span className="t-num text-[7.5rem] leading-[0.8] text-bronze-light">{stages[active].index}</span>
              <span className="t-label mb-2 max-w-[10rem] text-ivory/70">{stages[active].title}</span>
            </div>
            <ol className="mt-10 hidden space-y-2 md:block" aria-label={t.processSection.stagesAria}>
              {stages.map((s, i) => (
                <li key={s.key} className={`t-label flex gap-3 transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-40'}`}>
                  <span className="w-6">{s.index}</span>
                  <span>{s.title}</span>
                </li>
              ))}
            </ol>
            <p className="t-caption mt-12 max-w-xs text-ivory/55">{t.processDisclaimer}</p>
          </div>
        </div>

        <div className="col-span-12 mt-16 space-y-24 md:col-span-7 md:col-start-6 md:mt-0 md:space-y-36">
          {stages.map((s, i) => (
            <StageBlock key={s.key} stage={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StageBlock({ stage, i }: { stage: Stage; i: number }) {
  const { mobile } = useEngine()
  const t = useT()
  const el = useRef<HTMLElement>(null)
  const url = useStill(`stage-${stage.key}-${mobile}`, () => stageSpec(stage.key, mobile ? 0.6 : 1), el)
  const wide = i % 3 !== 1
  return (
    <article ref={el} data-stage className={wide ? '' : 'md:ps-[16%]'} aria-labelledby={`stage-${stage.key}`}>
      <div data-mask className="relative overflow-hidden bg-ink" style={{ aspectRatio: '4 / 3' }}>
        {url && <img src={url} alt={t.processSection.alt(stage.index, stage.title)} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      </div>
      <div className="mt-6 grid grid-cols-[3.5rem_1fr] gap-x-4 md:grid-cols-[5rem_1fr]">
        <span className="t-num text-[2.6rem] leading-none text-bronze-light">{stage.index}</span>
        <div>
          <h3 id={`stage-${stage.key}`} className="t-h3">{stage.title}</h3>
          <p className="t-body mt-3 max-w-[30rem] text-ivory/75">{stage.body}</p>
        </div>
      </div>
    </article>
  )
}
