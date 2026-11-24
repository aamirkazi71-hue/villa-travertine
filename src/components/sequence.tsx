import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { useEngine } from '../lib/engine'
import type { Chapter } from '../content/site'
import type { TrackName } from '../scene/tracks'
import { useI18n } from '../lib/i18n'

/**
 * Binds a tall, transparent section to a camera track.
 * Native scrolling drives progress; nothing is hijacked or pinned.
 */
export function useSequence(ref: RefObject<HTMLElement | null>, track: TrackName, onProgress?: (p: number) => void) {
  const { engine } = useEngine()
  const cb = useRef(onProgress)
  cb.current = onProgress

  useLayoutEffect(() => {
    const el = ref.current
    if (!engine || !el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (s) => {
        engine.setProgress(track, s.progress)
        cb.current?.(s.progress)
      },
      onRefresh: (s) => {
        engine.setProgress(track, s.progress, true)
        cb.current?.(s.progress)
      },
    })
    // Render the first frame straight away if the section is already on screen, rather than waiting for the observer.
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) engine.setTrackVisible(track, true)
    const io = new IntersectionObserver(([en]) => engine.setTrackVisible(track, en.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => {
      st.kill()
      io.disconnect()
      engine.setTrackVisible(track, false)
    }
  }, [engine, ref, track])
}

/** Height of a sequence in viewport units, and where a chapter slot sits within it. */
export const slotTop = (at: number, heightVh: number) => `${(at * (heightVh - 100)).toFixed(3)}vh`

export function ChapterSlot({ chapter, heightVh, mobile }: { chapter: Chapter; heightVh: number; mobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { dir } = useI18n()
  const light = chapter.tone === 'light'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const lines = el.querySelectorAll('[data-line]')
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lines,
        { yPercent: 105 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 72%', end: 'bottom 28%', toggleActions: 'play reverse play reverse' },
        },
      )
      gsap.fromTo(
        el.querySelectorAll('[data-fade]'),
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: 0.25,
          stagger: 0.06,
          scrollTrigger: { trigger: el, start: 'top 72%', end: 'bottom 28%', toggleActions: 'play reverse play reverse' },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  const alignRight = chapter.align === 'right'

  return (
    <div
      id={`chapter-${chapter.id}`}
      data-chapter
      className="absolute inset-x-0 flex h-screen"
      style={{ top: slotTop(chapter.at, heightVh) }}
    >
      {/* Placement is physical (the camera leaves space on that side), so this layer stays LTR in every language. */}
      <div
        ref={ref}
        dir="ltr"
        className={[
          'gutter relative flex w-full',
          mobile ? 'items-end pb-10' : chapter.valign === 'top' ? 'items-start pt-[calc(var(--nav-h)+4vh)]' : 'items-center',
          alignRight && !mobile ? 'justify-end' : 'justify-start',
        ].join(' ')}
      >
        <article
          dir={dir}
          className={[
            'isolate max-w-[30rem]',
            light ? 'scrim-dark text-ivory on-dark' : 'scrim-light text-ink',
            mobile ? 'w-full' : alignRight ? 'mr-[2vw]' : 'ml-[6vw] lg:ml-[9vw]',
          ].join(' ')}
          aria-labelledby={`chapter-${chapter.id}-title`}
        >
          <p className="t-label mb-5 flex items-center gap-3" data-fade>
            <span className={light ? 'text-bronze-light' : 'text-bronze'}>{chapter.index}</span>
            <span className="inline-block h-px w-8 bg-current opacity-40" />
            <span>{chapter.label}</span>
          </p>
          <h2 id={`chapter-${chapter.id}-title`} className="t-h2 mb-6">
            {chapter.title.map((l, i) => (
              <span key={i} className="block overflow-hidden pb-[0.08em]">
                <span data-line className={`block ${i === chapter.title.length - 1 ? 'italic-serif' : ''}`}>
                  {l}
                </span>
              </span>
            ))}
          </h2>
          <p className={`t-body max-w-[26rem] ${light ? 'text-ivory/85' : 'text-ink/80'}`} data-fade>
            {chapter.body}
          </p>
          {chapter.detail && (
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-current/20 pt-4" data-fade>
              {chapter.detail.map((d) => (
                <div key={d.k}>
                  <dt className={`t-label ${light ? 'text-ivory/60' : 'text-umber'}`}>{d.k}</dt>
                  <dd className="t-caption mt-1">{d.v}</dd>
                </div>
              ))}
            </dl>
          )}
        </article>
      </div>
    </div>
  )
}
