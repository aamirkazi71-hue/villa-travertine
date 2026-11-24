import * as THREE from 'three'

/**
 * Time-of-day lighting. A handful of measured presets across the day; any hour in
 * between is interpolated. `night` drives the interior lamps (0 = off, 1 = full),
 * `stars` the night sky, `exp` a gentle exposure adaptation.
 */
export type Lighting = {
  sun: THREE.Vector3
  sunColor: THREE.Color
  sunI: number
  hemiSky: THREE.Color
  hemiGround: THREE.Color
  hemiI: number
  top: THREE.Color
  horizon: THREE.Color
  ground: THREE.Color
  cloud: THREE.Color
  cloudShade: THREE.Color
  env: number
  lamp: number
  flame: number
  night: number
  stars: number
  exp: number
}

type Preset = { h: number } & Omit<Lighting, 'sun' | 'sunColor' | 'hemiSky' | 'hemiGround' | 'top' | 'horizon' | 'ground' | 'cloud' | 'cloudShade'> & {
  sun: [number, number, number]
  sunColor: string
  hemiSky: string
  hemiGround: string
  top: string
  horizon: string
  ground: string
  cloud: string
  cloudShade: string
}

const PRESETS: Preset[] = [
  {
    h: 6,
    sun: [0.88, 0.05, 0.3], sunColor: '#ffad78', sunI: 0.9,
    hemiSky: '#8a98ba', hemiGround: '#4a4238', hemiI: 0.45,
    top: '#3f5888', horizon: '#eeb48a', ground: '#5c564c', cloud: '#ffc6a0', cloudShade: '#6a6d86',
    env: 0.5, lamp: 3.5, flame: 3.5, night: 0.7, stars: 0.15, exp: 1.12,
  },
  {
    h: 8.5,
    sun: [0.78, 0.4, 0.48], sunColor: '#fff0dc', sunI: 3.0,
    hemiSky: '#d6e2ee', hemiGround: '#a69c86', hemiI: 0.95,
    top: '#7fa3cc', horizon: '#e9e5dc', ground: '#a49e8a', cloud: '#ffffff', cloudShade: '#a9b3c0',
    env: 1.0, lamp: 1.2, flame: 2.0, night: 0, stars: 0, exp: 1.0,
  },
  {
    h: 12.5,
    sun: [0.12, 0.92, 0.38], sunColor: '#fff8ee', sunI: 3.8,
    hemiSky: '#dbe6f0', hemiGround: '#a8a08a', hemiI: 1.05,
    top: '#6c95c6', horizon: '#e6e6e0', ground: '#a8a28e', cloud: '#ffffff', cloudShade: '#aeb8c4',
    env: 1.0, lamp: 1.2, flame: 2.0, night: 0, stars: 0, exp: 0.95,
  },
  {
    h: 16,
    sun: [-0.78, 0.5, 0.42], sunColor: '#fff0d9', sunI: 3.4,
    hemiSky: '#dde6ee', hemiGround: '#a69c86', hemiI: 1.0,
    top: '#7f9fc6', horizon: '#ebe3d3', ground: '#a49e8a', cloud: '#fffaf2', cloudShade: '#a7b0bb',
    env: 1.0, lamp: 1.4, flame: 2.0, night: 0, stars: 0, exp: 1.0,
  },
  {
    h: 19.5,
    sun: [-0.92, 0.07, -0.38], sunColor: '#ff9f5a', sunI: 1.4,
    hemiSky: '#6d7ea3', hemiGround: '#3a332b', hemiI: 0.45,
    top: '#1c2b4d', horizon: '#d8956a', ground: '#3c3631', cloud: '#ffb48a', cloudShade: '#545a74',
    env: 0.45, lamp: 5.0, flame: 4.5, night: 1, stars: 0.1, exp: 1.15,
  },
  {
    h: 23,
    sun: [-0.3, 0.55, 0.6], sunColor: '#9db2da', sunI: 0.22,
    hemiSky: '#2a3550', hemiGround: '#141210', hemiI: 0.22,
    top: '#050913', horizon: '#1a2234', ground: '#0c0c0e', cloud: '#323d58', cloudShade: '#0e121c',
    env: 0.16, lamp: 5.5, flame: 5.0, night: 1, stars: 1, exp: 1.4,
  },
]

const out: Lighting = {
  sun: new THREE.Vector3(),
  sunColor: new THREE.Color(),
  hemiSky: new THREE.Color(),
  hemiGround: new THREE.Color(),
  hemiI: 0,
  sunI: 0,
  top: new THREE.Color(),
  horizon: new THREE.Color(),
  ground: new THREE.Color(),
  cloud: new THREE.Color(),
  cloudShade: new THREE.Color(),
  env: 0,
  lamp: 0,
  flame: 0,
  night: 0,
  stars: 0,
  exp: 1,
}
const ca = new THREE.Color()
const cb = new THREE.Color()

export const HOUR_MIN = PRESETS[0].h
export const HOUR_MAX = PRESETS[PRESETS.length - 1].h
/** The walkthrough's default light: mid-afternoon. */
export const AFTERNOON = 16
export const DUSK = 19.5

/** Interpolated lighting for an hour of the day (shared output object; copy if you keep it). */
export function lightingAt(hour: number): Lighting {
  const h = Math.min(HOUR_MAX, Math.max(HOUR_MIN, hour))
  let i = 0
  while (i < PRESETS.length - 2 && h > PRESETS[i + 1].h) i++
  const a = PRESETS[i]
  const b = PRESETS[i + 1]
  const u = (h - a.h) / (b.h - a.h)
  const t = u * u * (3 - 2 * u)
  const col = (k: 'sunColor' | 'hemiSky' | 'hemiGround' | 'top' | 'horizon' | 'ground' | 'cloud' | 'cloudShade') =>
    out[k].copy(ca.set(a[k])).lerp(cb.set(b[k]), t)
  const num = (k: 'sunI' | 'hemiI' | 'env' | 'lamp' | 'flame' | 'night' | 'stars' | 'exp') => (out[k] = a[k] + (b[k] - a[k]) * t)
  out.sun.set(...a.sun).normalize().lerp(new THREE.Vector3(...b.sun).normalize(), t).normalize()
  col('sunColor')
  col('hemiSky')
  col('hemiGround')
  col('top')
  col('horizon')
  col('ground')
  col('cloud')
  col('cloudShade')
  num('sunI')
  num('hemiI')
  num('env')
  num('lamp')
  num('flame')
  num('night')
  num('stars')
  num('exp')
  return out
}

/** "16:30" style label, and a spoken form for assistive technology. */
export function formatHour(hour: number) {
  const hh = Math.floor(hour)
  const mm = Math.round((hour - hh) * 60 / 15) * 15
  const h2 = mm === 60 ? hh + 1 : hh
  const m2 = mm === 60 ? 0 : mm
  return `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`
}
