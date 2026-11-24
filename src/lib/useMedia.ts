import { useSyncExternalStore } from 'react'

export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** `?motion=reduce` forces the reduced-motion experience, for review without changing OS settings. */
const forcedReduce = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('motion') === 'reduce'

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)') || forcedReduce
export const useMobile = () => useMedia('(max-width: 767px), (pointer: coarse) and (max-width: 1024px)')
