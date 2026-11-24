import { useCallback, useEffect, useRef, useState } from 'react'
import type { Chapter } from '../content/site'
import { useT } from '../lib/i18n'
import { useEngine } from '../lib/engine'
import { ChapterSlot, useSequence } from './sequence'
import { ExteriorScene } from './scenes/ExteriorScene'
import { ChapterRail } from './ChapterRail'

function usePick() {
  const chapters = useT().villaChapters
  return (...ids: string[]) => chapters.filter((c) => ids.includes(c.id))
}

/** Entrance: the approach, the pivot door, and the hall. */
function EntranceScene(props: SceneProps) {
  return <Chapters list={usePick()('entrance', 'hall')} {...props} />
}
/** The double-height living room. */
function LivingRoomScene(props: SceneProps) {
  return <Chapters list={usePick()('living')} {...props} />
}
/** Kitchen and dining. */
function KitchenScene(props: SceneProps) {
  return <Chapters list={usePick()('kitchen')} {...props} />
}
/** The stair, principal suite and bathroom. */
function PrivateSpacesScene(props: SceneProps) {
  return <Chapters list={usePick()('stair', 'private', 'bath')} {...props} />
}

type SceneProps = { heightVh: number; mobile: boolean }
function Chapters({ list, heightVh, mobile }: SceneProps & { list: Chapter[] }) {
  return (
    <>
      {list.map((c) => (
        <ChapterSlot key={c.id} chapter={c} heightVh={heightVh} mobile={mobile} />
      ))}
    </>
  )
}

/**
 * The villa walkthrough: one tall transparent section over the fixed 3D stage.
 * Scroll position maps to a single continuous camera path through the model.
 */
export function CinematicVillaExperience() {
  const { mobile } = useEngine()
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  const heightVh = mobile ? 1150 : 1400
  const [progress, setProgress] = useState(0)
  const [inView, setInView] = useState(true)
  const bar = useRef<HTMLDivElement>(null)

  const onProgress = useCallback((p: number) => {
    if (bar.current) bar.current.style.transform = `scaleX(${p})`
    setProgress((prev) => (Math.abs(prev - p) > 0.004 ? p : prev))
  }, [])
  useSequence(ref, 'walk', onProgress)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRect.height > window.innerHeight * 0.5), {
      threshold: [0, 0.02, 0.1, 0.5, 1],
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      id="villa"
      ref={ref}
      aria-label={t.ui.villaAria}
      data-nav="dark"
      className="relative"
      style={{ height: `${heightVh}vh` }}
    >
      <ExteriorScene />
      <EntranceScene heightVh={heightVh} mobile={mobile} />
      <LivingRoomScene heightVh={heightVh} mobile={mobile} />
      <KitchenScene heightVh={heightVh} mobile={mobile} />
      <PrivateSpacesScene heightVh={heightVh} mobile={mobile} />

      {/* Orientation: where you are in the house, and how far through. */}
      <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-20 transition-opacity duration-500 ${inView && progress > 0.04 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-px w-full bg-ink/10">
          <div ref={bar} className="h-px origin-left bg-ink/60 rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
      {!mobile && <ChapterRail chapters={t.villaChapters} progress={progress} visible={inView && progress > 0.04} sectionRef={ref} />}
    </section>
  )
}
