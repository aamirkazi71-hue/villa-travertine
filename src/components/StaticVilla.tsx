import { useRef, type RefObject } from 'react'
import type { Chapter } from '../content/site'
import { useEngine, useStill } from '../lib/engine'
import { useT } from '../lib/i18n'
import type { TrackName } from '../scene/tracks'

/**
 * Reduced-motion (and no-WebGL) version of the two villa sequences.
 * The same model is rendered to still frames at each chapter's camera position,
 * and laid out as an editorial sequence that scrolls normally.
 */
export function StaticVilla({ part }: { part: 'walk' | 'assembly' }) {
  const t = useT()
  const list = part === 'walk' ? t.villaChapters : t.engineeringChapters
  return (
    <section
      id={part === 'walk' ? 'villa' : 'engineering'}
      aria-label={part === 'walk' ? t.ui.villaAria : t.ui.engineeringShort}
      data-nav="dark"
      data-nav-bg="ivory"
      className="relative z-30 bg-ivory"
    >
      {part === 'walk' && <StaticHero />}
      <div className="gutter space-y-24 py-24 md:space-y-36 md:py-36">
        {list.map((c, i) => (
          <StaticChapter key={c.id} chapter={c} track={part} flip={i % 2 === 1} />
        ))}
        {part === 'assembly' && <p className="t-caption max-w-md text-umber">{t.engineeringDisclaimer}</p>}
      </div>
    </section>
  )
}

function useChapterStill(track: TrackName, p: number, w: number, h: number, near?: RefObject<Element | null>) {
  const { engine, mobile } = useEngine()
  const s = mobile ? 0.55 : 1
  return useStill(`static-${track}-${p}-${mobile}`, () => ({
    kind: 'villa',
    pose: engine!.poseAt(track, p),
    state: engine!.stateAt(track, p),
    width: Math.round(w * s),
    height: Math.round(h * s),
  }), near)
}

function Frame({ url, alt, ratio }: { url: string | null; alt: string; ratio: string }) {
  const { status } = useEngine()
  const t = useT()
  return (
    <div className="relative w-full overflow-hidden bg-limestone" style={{ aspectRatio: ratio }}>
      {url ? (
        <img src={url} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-end p-4">
          <span className="t-caption text-umber">{status === 'error' ? t.ui.noWebgl : t.ui.rendering}</span>
        </div>
      )}
    </div>
  )
}

function StaticHero() {
  const t = useT()
  const url = useChapterStill('walk', 0, 1600, 1000)
  return (
    <div className="relative min-h-[100svh]">
      <div className="absolute inset-0">
        {url && <img src={url} alt={t.ui.heroAlt} className="h-full w-full object-cover" />}
      </div>
      <div className="gutter relative flex min-h-[100svh] flex-col justify-start pb-12 pt-[calc(var(--nav-h)+5vh)]">
        <div className="scrim-light isolate max-w-3xl">
          <p className="t-label mb-6 text-ink/70">{t.hero.label}</p>
          <h1 className="t-display">
            {t.hero.headline[0]}
            <br />
            <span className="italic-serif ps-[0.6em]">{t.hero.headline[1]}</span>
          </h1>
          <p className="t-lede mt-7 max-w-[26rem] text-ink/80">{t.hero.supporting}</p>
        </div>
      </div>
    </div>
  )
}

function StaticChapter({ chapter, track, flip }: { chapter: Chapter; track: TrackName; flip: boolean }) {
  const t = useT()
  const el = useRef<HTMLElement>(null)
  const url = useChapterStill(track, chapter.at, 1600, 1000, el)
  return (
    <article ref={el} className="grid grid-cols-12 items-end gap-x-6 gap-y-8" aria-labelledby={`s-${chapter.id}`}>
      <div className={`col-span-12 lg:col-span-8 ${flip ? 'lg:order-2 lg:col-start-5' : ''}`}>
        <Frame url={url} alt={t.ui.chapterAlt(chapter.label)} ratio="16 / 10" />
      </div>
      <div className={`col-span-12 md:col-span-8 lg:col-span-4 ${flip ? 'lg:order-1 lg:col-start-1 lg:row-start-1' : ''}`}>
        <p className="t-label mb-4 flex gap-3">
          <span className="text-bronze">{chapter.index}</span>
          <span>{chapter.label}</span>
        </p>
        <h2 id={`s-${chapter.id}`} className="t-h2 mb-5">
          {chapter.title[0]} <span className="italic-serif">{chapter.title.slice(1).join(' ')}</span>
        </h2>
        <p className="t-body text-ink/80">{chapter.body}</p>
      </div>
    </article>
  )
}
