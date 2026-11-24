import { useCallback, useEffect, useRef, useState } from 'react'
import { notes } from '../scene/notes'
import { useT } from '../lib/i18n'
import { useEngine } from '../lib/engine'

/**
 * Architectural annotations and clickable hotspots. The engine projects each note's
 * 3D anchor to the screen every frame and writes position/opacity directly.
 * Notes with a close-up become buttons: clicking flies the camera in and opens a card.
 */
export function AnnotationLayer() {
  const { engine } = useEngine()
  const t = useT()
  const hotspotDetails = t.hotspotDetails
  const layer = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<string | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  // Clip the layer to whichever villa sequence is on screen, so labels never float over other sections.
  useEffect(() => {
    let raf = 0
    const clip = () => {
      raf = 0
      const el = layer.current
      if (!el) return
      const vh = window.innerHeight
      let top = vh
      let bottom = 0
      for (const id of ['villa', 'engineering']) {
        const r = document.getElementById(id)?.getBoundingClientRect()
        if (!r || r.bottom <= 0 || r.top >= vh) continue
        top = Math.min(top, Math.max(0, r.top))
        bottom = Math.max(bottom, Math.min(vh, r.bottom))
      }
      el.style.clipPath = bottom > top ? `inset(${top}px 0 ${vh - bottom}px 0)` : 'inset(50% 0 50% 0)'
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(clip)
    }
    clip()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [])

  const close = useCallback(() => {
    engine?.focusOn(null)
    setOpen(null)
    document.body.classList.remove('is-focused')
    opener.current?.focus({ preventScroll: true })
  }, [engine])

  const show = (key: string, btn: HTMLButtonElement) => {
    opener.current = btn
    engine?.focusOn(key)
    setOpen(key)
    document.body.classList.add('is-focused')
  }

  // Escape or scrolling away returns to the tour.
  useEffect(() => {
    if (!open) return
    heading.current?.focus({ preventScroll: true })
    const startY = window.scrollY
    const onScroll = () => Math.abs(window.scrollY - startY) > 80 && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const detail = open ? hotspotDetails[open] : null

  return (
    <>
      <div ref={layer} className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {notes.map((n) => {
          const clickable = Boolean(n.focus && hotspotDetails[n.key])
          const ref = (el: HTMLElement | null) => engine?.registerNote(n.key, el)
          const inner = (
            <>
              <span className="note-dot" />
              <span className="note-line" />
              <span className="note-text t-label">
                {t.noteLabels[n.key] ?? n.label}
                {clickable && <span className="note-more" aria-hidden>+</span>}
              </span>
            </>
          )
          return clickable ? (
            <button
              key={n.key}
              ref={ref}
              type="button"
              tabIndex={-1}
              className="note note-hotspot"
              data-side={n.side ?? 'right'}
              aria-label={t.ui.viewDetail(t.noteLabels[n.key] ?? n.label)}
              onClick={(e) => show(n.key, e.currentTarget)}
            >
              {inner}
            </button>
          ) : (
            <div key={n.key} ref={ref} className="note" data-side={n.side ?? 'right'} aria-hidden="true">
              {inner}
            </div>
          )
        })}
      </div>

      <aside
        className={`fixed right-[var(--gutter)] top-1/2 z-40 w-[min(24rem,calc(100vw-2*var(--gutter)))] -translate-y-1/2 bg-ivory text-ink shadow-[0_30px_80px_-30px_rgba(23,21,19,0.45)] transition-[opacity,transform] duration-700 ease-[var(--ease-arch)] ${
          detail ? 'opacity-100' : 'pointer-events-none translate-x-6 opacity-0'
        }`}
        aria-hidden={!detail}
        aria-labelledby="hotspot-title"
      >
        {detail && (
          <div className="p-7">
            <p className="t-label text-bronze">{t.ui.detail}</p>
            <h2 id="hotspot-title" ref={heading} tabIndex={-1} className="t-h3 mt-3 outline-none">
              {detail.title}
            </h2>
            <p className="t-body mt-4 text-ink/80">{detail.body}</p>
            {detail.facts && (
              <dl className="mt-6 border-t border-ink/15">
                {detail.facts.map((f) => (
                  <div key={f.k} className="flex justify-between gap-6 border-b border-ink/15 py-2.5">
                    <dt className="t-label text-umber">{f.k}</dt>
                    <dd className="t-caption text-right">{f.v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <button type="button" onClick={close} className="t-label link-quiet mt-7 pb-1">
              {t.ui.backArrow} {t.ui.backToTour}
            </button>
            <p className="t-caption mt-3 text-ink/50">{t.ui.backHint}</p>
          </div>
        )}
      </aside>
    </>
  )
}
