import type { RefObject } from 'react'
import type { Chapter } from '../content/site'
import { useT } from '../lib/i18n'

/**
 * Quiet chapter index along the bottom edge. Shows where you are in the house
 * and lets visitors jump between rooms without scrubbing the whole sequence.
 */
export function ChapterRail({
  chapters,
  progress,
  visible,
  sectionRef,
  tone = 'dark',
}: {
  chapters: Chapter[]
  progress: number
  visible: boolean
  sectionRef: RefObject<HTMLElement | null>
  tone?: 'dark' | 'light'
}) {
  const t = useT()
  let active = -1
  chapters.forEach((c, i) => {
    if (progress >= c.at - 0.06) active = i
  })

  const jump = (c: Chapter) => {
    const el = sectionRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + c.at * span, behavior: 'smooth' })
  }

  return (
    <nav
      aria-label={t.ui.rooms}
      className={`fixed bottom-6 left-[var(--gutter)] z-30 transition-opacity duration-500 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'} ${tone === 'light' ? 'text-ivory' : 'text-ink'}`}
    >
      <ol className="flex items-baseline gap-4">
        {chapters.map((c, i) => {
          const on = i === active
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => jump(c)}
                tabIndex={visible ? 0 : -1}
                aria-current={on ? 'step' : undefined}
                aria-label={`${c.index} ${c.label}`}
                className={`t-label flex items-baseline gap-2 transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-45 hover:opacity-80'}`}
              >
                <span>{c.index}</span>
                <span className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-700 ease-[var(--ease-arch)] ${on ? 'max-w-48' : 'max-w-0'}`}>
                  — {c.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
