import { createContext, useContext, useEffect, useState, type RefObject } from 'react'
import type { VillaEngine, StillSpec } from '../scene/engine'

export type EngineStatus = 'loading' | 'ready' | 'error'
export type EngineCtx = { engine: VillaEngine | null; status: EngineStatus; reduced: boolean; mobile: boolean }

export const EngineContext = createContext<EngineCtx>({ engine: null, status: 'loading', reduced: false, mobile: false })
export const useEngine = () => useContext(EngineContext)

const cache = new WeakMap<VillaEngine, Map<string, Promise<string>>>()

/** True once the element is within ~2 viewports of being visible (lazy loading). */
export function useNear(ref: RefObject<Element | null>, margin = '200% 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin, near])
  return near
}

/**
 * Request an offscreen render from the shared model. Returns null until ready.
 * Pass a ref to defer rendering until that element approaches the viewport.
 */
export function useStill(key: string, spec: () => StillSpec, near?: RefObject<Element | null>) {
  const { engine } = useEngine()
  const [url, setUrl] = useState<string | null>(null)
  const isNear = useNear(near ?? { current: null })
  const enabled = near ? isNear : true
  useEffect(() => {
    if (!engine || !enabled) return
    let map = cache.get(engine)
    if (!map) cache.set(engine, (map = new Map()))
    let p = map.get(key)
    if (!p) {
      p = engine.renderStill(spec())
      map.set(key, p)
    }
    let live = true
    p.then((u) => live && setUrl(u)).catch(() => {})
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, key, enabled])
  return url
}
