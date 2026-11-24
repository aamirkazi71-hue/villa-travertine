import { useEffect, useRef, useState } from 'react'
import type { VillaEngine } from './scene/engine'
import { EngineContext, type EngineStatus } from './lib/engine'
import { useMobile, useReducedMotion } from './lib/useMedia'
import { ScrollTrigger } from './lib/gsap'
import { SiteNavigation } from './components/SiteNavigation'
import { CinematicVillaExperience } from './components/CinematicVillaExperience'
import { StaticVilla } from './components/StaticVilla'
import { MaterialsSection } from './components/MaterialsSection'
import { EngineeringReveal } from './components/EngineeringReveal'
import { ConstructionTimeline } from './components/ConstructionTimeline'
import { ProjectPortfolio } from './components/ProjectPortfolio'
import { ConsultationSection } from './components/ConsultationSection'
import { SiteFooter } from './components/SiteFooter'
import { AnnotationLayer } from './components/AnnotationLayer'
import { TimeOfDayControl } from './components/TimeOfDayControl'
import { useT } from './lib/i18n'

const reducedNow = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('motion') === 'reduce'

export function App() {
  const reduced = useReducedMotion()
  const t = useT()
  const mobile = useMobile()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [engine, setEngine] = useState<VillaEngine | null>(null)
  const [status, setStatus] = useState<EngineStatus>('loading')
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let e: VillaEngine | null = null
    let cancelled = false
    const canvas = canvasRef.current!
    const lost = (ev: Event) => {
      ev.preventDefault()
      setStatus('error')
    }
    canvas.addEventListener('webglcontextlost', lost)
    import('./scene/engine')
      .then(({ VillaEngine }) => {
        if (cancelled) return
        try {
          performance.mark('villa:engine-start')
          e = new VillaEngine(canvas, { mobile })
          e.ambient = !reducedNow()
          if (import.meta.env.DEV) Object.assign(window, { __engine: e })
          e.onFirstFrame(() => {
            performance.mark('villa:first-frame')
            setShown(true)
          })
          setEngine(e)
          setStatus('ready')
        } catch (err) {
          console.error('3D view unavailable:', err)
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
    return () => {
      cancelled = true
      canvas.removeEventListener('webglcontextlost', lost)
      e?.dispose()
      setEngine(null)
      setShown(false)
    }
  }, [mobile])

  // Layout can shift once fonts arrive; keep scroll measurements honest.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  const cinematic = !reduced && status !== 'error'

  return (
    <EngineContext.Provider value={{ engine, status, reduced, mobile }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:bg-ivory focus:px-4 focus:py-3 t-label">
        {t.ui.skip}
      </a>
      <SiteNavigation />

      {/* Shared, fixed 3D stage. Opaque sections scroll over it; the two villa sequences are transparent windows onto it. */}
      <div aria-hidden="true" className={cinematic ? 'fixed inset-0 z-0' : 'hidden'}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#7d9cbf 0%, #c9d2d6 45%, #e6e2d8 62%, #b9b3a2 63%, #8d8a73 100%)' }} />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full transition-opacity duration-[1400ms] ease-out"
          style={{ opacity: shown ? 1 : 0 }}
        />
      </div>
      {cinematic && !mobile && <AnnotationLayer />}
      {cinematic && <TimeOfDayControl />}

      <main id="main" className="relative z-10">
        {cinematic ? <CinematicVillaExperience /> : <StaticVilla part="walk" />}
        <MaterialsSection />
        {cinematic ? <EngineeringReveal /> : <StaticVilla part="assembly" />}
        <ConstructionTimeline />
        <ProjectPortfolio />
        <ConsultationSection />
      </main>
      <SiteFooter />
    </EngineContext.Provider>
  )
}
