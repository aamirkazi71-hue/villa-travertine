import { useEffect, useRef } from 'react'
import { useT } from '../../lib/i18n'
import { gsap } from '../../lib/gsap'

/**
 * Section A — Cinematic arrival.
 * The camera sits low on the lawn, so the sky takes the upper half of the frame.
 * The headline is set in that sky; the house sits below and to the right.
 * As the camera starts moving, the type steps back and the architecture takes over.
 */
export function ExteriorScene() {
  const ref = useRef<HTMLDivElement>(null)
  const t = useT()
  const hero = t.hero

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-line]', { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: 'power3.out', stagger: 0.12, delay: 0.2 })
      gsap.fromTo('[data-hero-fade]', { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.8, stagger: 0.08 })
      gsap.to('[data-hero-type]', {
        opacity: 0,
        y: -80,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '50% top', scrub: true },
      })
      gsap.to('[data-hero-meta]', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '25% top', scrub: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="absolute inset-x-0 top-0 h-screen" data-nav="dark">
      <div className="gutter flex h-full flex-col justify-between pb-[max(1.75rem,4.5vh)] pt-[calc(var(--nav-h)+5vh)]">
        <div data-hero-type className="max-w-[62rem]">
          <p className="t-label mb-6 text-ink/70" data-hero-fade>
            {hero.label}
          </p>
          <h1 className="t-display text-ink">
            {hero.headline.map((l, i) => (
              <span key={i} className="block overflow-hidden pb-[0.06em]">
                <span data-hero-line className={`block ${i === 1 ? 'italic-serif ps-[0.55em]' : ''}`}>
                  {l}
                </span>
              </span>
            ))}
          </h1>
        </div>

        <div data-hero-meta className="grid grid-cols-12 items-end gap-x-6 gap-y-6">
          <p className="t-lede col-span-12 max-w-[22rem] text-ink/85 md:col-span-4" data-hero-fade>
            {hero.supporting}
          </p>
          <div className="col-span-12 flex items-center gap-4 text-ink/80 md:col-span-4 md:justify-center" data-hero-fade>
            <span className="relative block h-10 w-px overflow-hidden bg-ink/20">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.4s_var(--ease-arch)_infinite] bg-ink" />
            </span>
            <span className="t-label">{t.ui.scrollCue}</span>
          </div>
          <dl className="hidden border-t border-ink/30 md:col-span-4 md:block lg:col-span-3 lg:col-start-10" data-hero-fade>
            {hero.meta.map((m) => (
              <div key={m.k} className="flex justify-between gap-6 border-b border-ink/15 py-2">
                <dt className="t-label text-ink/70">{m.k}</dt>
                <dd className="t-caption text-end text-ink">{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
