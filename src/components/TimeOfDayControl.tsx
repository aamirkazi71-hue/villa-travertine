import { useEffect, useId, useState } from 'react'
import { useEngine } from '../lib/engine'
import { formatHour, HOUR_MAX, HOUR_MIN } from '../scene/lighting'
import { useT } from '../lib/i18n'

/**
 * Lets visitors set the time of day while the villa is on screen: sun position,
 * sky, clouds, interior lamps and night stars all follow. "Auto" hands control back
 * to the tour (afternoon in the house, dusk at the end of the engineering sequence).
 */
export function TimeOfDayControl() {
  const { engine, mobile } = useEngine()
  const t = useT()
  const spoken = (h: number) => {
    const [hh, mm] = formatHour(h).split(':').map(Number)
    return t.ui.spokenTime(hh, mm)
  }
  const [hour, setHour] = useState(16)
  const [auto, setAuto] = useState(true)
  const [visible, setVisible] = useState(true)
  const id = useId()

  useEffect(() => {
    if (!engine) return
    engine.onHourChange((h, isAuto) => {
      setHour(h)
      setAuto(isAuto)
    })
    return () => engine.onHourChange(null)
  }, [engine])

  // Only offered while one of the 3D sequences is on screen.
  useEffect(() => {
    const els = ['villa', 'engineering'].map((x) => document.getElementById(x)).filter(Boolean) as HTMLElement[]
    const seen = new Map<Element, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.intersectionRatio > 0 && e.intersectionRect.height > window.innerHeight * 0.6)
        setVisible([...seen.values()].some(Boolean))
      },
      { threshold: [0, 0.05, 0.2, 0.5] },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Stay out of the opening screen, where the hero's project details occupy that corner.
  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    const on = () => setPastHero(window.scrollY > window.innerHeight * 0.6)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const shown = visible && pastHero

  const change = (h: number) => {
    setHour(h)
    setAuto(false)
    engine?.setHour(h)
  }

  if (!engine) return null

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className={`fixed z-40 border border-ink/10 bg-ivory/92 text-ink shadow-[0_18px_50px_-25px_rgba(23,21,19,0.5)] transition-opacity duration-500 ${
        mobile ? 'right-[var(--gutter)] top-[calc(var(--nav-h)+0.25rem)] w-52 px-3 py-2.5' : 'bottom-6 right-[var(--gutter)] w-64 px-4 py-3.5'
      } ${shown ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!shown}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="t-label text-umber">
          {t.ui.light}
        </span>
        <span className="t-num text-[1.35rem] leading-none tabular-nums" aria-hidden>
          {formatHour(hour)}
        </span>
        <button
          type="button"
          onClick={() => {
            setAuto(true)
            engine.setHour(null)
          }}
          aria-pressed={auto}
          tabIndex={shown ? 0 : -1}
          className={`t-label border px-2 py-1 transition-colors duration-300 ${auto ? 'border-ink bg-ink text-ivory' : 'border-ink/30 hover:border-ink'}`}
        >
          {t.ui.auto}
        </button>
      </div>
      <input
        type="range"
        className="time-range mt-3 w-full"
        min={HOUR_MIN}
        max={HOUR_MAX}
        step={0.25}
        value={hour}
        tabIndex={shown ? 0 : -1}
        onChange={(e) => change(Number(e.target.value))}
        aria-labelledby={`${id}-label`}
        aria-valuetext={spoken(hour)}
      />
      <div className="t-caption relative mt-1 h-4 text-ink/50" aria-hidden>
        <span className="absolute start-0">{t.ui.dawn}</span>
        <span className="absolute -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${((12 - HOUR_MIN) / (HOUR_MAX - HOUR_MIN)) * 100}%` }}>
          {t.ui.noon}
        </span>
        <span className="absolute end-0">{t.ui.night}</span>
      </div>
    </div>
  )
}
