import { useCallback, useRef, useState } from 'react'
import { useEngine } from '../lib/engine'
import { useT } from '../lib/i18n'
import { ChapterSlot, useSequence } from './sequence'
import { ChapterRail } from './ChapterRail'

/**
 * Section G — Engineering reveal, then the return to the exterior at dusk.
 * The model separates along its construction layers, the cladding lifts off the
 * structure, then everything reassembles as the light falls.
 */
export function EngineeringReveal() {
  const { mobile } = useEngine()
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  const heightVh = mobile ? 750 : 900
  const [p, setP] = useState(0)
  const onProgress = useCallback((v: number) => {
    setP((prev) => (Math.abs(prev - v) > 0.004 ? v : prev))
    // Navigation ink follows the light: dark on daylight sky, light once dusk falls.
    ref.current?.setAttribute('data-nav', v > 0.78 ? 'light' : 'dark')
  }, [])
  useSequence(ref, 'assembly', onProgress)
  const dusk = p > 0.78

  return (
    <section id="engineering" ref={ref} aria-label={t.ui.engineeringAria} data-nav="dark" className="relative" style={{ height: `${heightVh}vh` }}>
      {t.engineeringChapters.map((c) => (
        <ChapterSlot key={c.id} chapter={c} heightVh={heightVh} mobile={mobile} />
      ))}
      {/* Phones: top-left, clear of the Light control at top-right. Desktop: bottom-right, above it. */}
      <p
        className={`t-caption pointer-events-none fixed left-[var(--gutter)] top-[calc(var(--nav-h)+0.25rem)] z-20 max-w-[11rem] text-start transition-opacity duration-500 md:left-auto md:right-[var(--gutter)] md:bottom-36 md:top-auto md:max-w-xs md:text-end ${
          p > 0.08 && p < 0.7 ? 'opacity-100' : 'opacity-0'
        } ${dusk ? 'text-ivory/70' : 'text-ink/70'}`}
      >
        {t.engineeringDisclaimer}
      </p>
      {!mobile && (
        <ChapterRail chapters={t.engineeringChapters} progress={p} visible={p > 0.04 && p < 0.995} sectionRef={ref} tone={dusk ? 'light' : 'dark'} />
      )}
    </section>
  )
}
