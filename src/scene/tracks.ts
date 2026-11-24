import * as THREE from 'three'

/**
 * Camera choreography. Each track is a list of keyframes placed on scroll
 * progress (0–1). `hold` keyframes ease in and out, so the camera settles
 * where a chapter's text is read; pass-through keyframes keep moving.
 */

export type Key = {
  p: number
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
  /** Exposure, so moving from sunlit exterior to interior reads like a camera adapting. */
  exp: number
  hold?: boolean
  /** Portrait (phone) overrides, where the landscape composition would crop the subject. */
  mpos?: [number, number, number]
  mlook?: [number, number, number]
}

export type TrackName = 'walk' | 'assembly'

export const tracks: Record<TrackName, Key[]> = {
  walk: [
    { p: 0.0, pos: [2.5, 1.35, 41], look: [-5.5, 7.6, 3], fov: 40, exp: 0.82, hold: true, mpos: [0, 1.4, 46], mlook: [-0.5, 7.2, 3] },
    { p: 0.07, pos: [0.5, 1.9, 30], look: [-3.5, 3.4, 3], fov: 38, exp: 0.85 },
    { p: 0.16, pos: [-1.2, 1.68, 10.6], look: [-1.2, 2.0, 4.8], fov: 42, exp: 1.0, hold: true },
    { p: 0.215, pos: [-1.2, 1.65, 6.0], look: [-1.25, 1.75, 0], fov: 46, exp: 1.15 },
    { p: 0.27, pos: [-0.9, 1.65, 3.2], look: [-7.5, 2.4, -1.4], fov: 50, exp: 1.15, hold: true },
    { p: 0.33, pos: [-3.6, 1.6, 5.0], look: [-8.6, 2.8, -4.5], fov: 54, exp: 1.15 },
    { p: 0.4, pos: [-4.4, 1.5, 4.9], look: [-9.0, 4.1, -5.0], fov: 56, exp: 1.15, hold: true },
    { p: 0.455, pos: [-4.9, 1.66, -1.2], look: [-11.25, 1.9, 0.25], fov: 48, exp: 1.15, hold: true },
    { p: 0.49, pos: [-3.7, 1.6, 1.7], look: [1, 1.5, 0.5], fov: 52, exp: 1.12 },
    { p: 0.515, pos: [-1.4, 1.6, 0.9], look: [5, 1.3, -2.5], fov: 52, exp: 1.12 },
    { p: 0.56, pos: [2.8, 1.65, -1.4], look: [8.6, 1.1, 3.0], fov: 54, exp: 1.15, hold: true, mlook: [6.6, 1.2, 4.2] },
    { p: 0.61, pos: [9.1, 1.6, 1.45], look: [7.6, 1.05, 3.0], fov: 40, exp: 1.15, hold: true },
    { p: 0.65, pos: [-1.0, 1.6, 1.3], look: [-5, 2.2, 1], fov: 50, exp: 1.15 },
    { p: 0.7, pos: [-6.0, 1.55, 2.9], look: [-3.4, 3.4, -3.4], fov: 54, exp: 1.12, hold: true },
    { p: 0.735, pos: [-3.55, 2.55, -0.2], look: [-3.55, 4.4, -5.4], fov: 54, exp: 1.12 },
    { p: 0.765, pos: [-3.55, 4.6, -3.7], look: [-3.4, 5.7, -7], fov: 54, exp: 1.15 },
    { p: 0.785, pos: [-3.5, 5.85, -5.4], look: [0, 5.8, -5.4], fov: 54, exp: 1.15 },
    { p: 0.805, pos: [-1.6, 5.85, -4.6], look: [-1.5, 5.75, 3], fov: 54, exp: 1.12 },
    { p: 0.83, pos: [-1.5, 5.8, 2.5], look: [5, 5.6, 2.5], fov: 54, exp: 1.12 },
    { p: 0.855, pos: [2.0, 5.8, 2.5], look: [7, 5.4, 1], fov: 54, exp: 1.12 },
    { p: 0.885, pos: [5.0, 5.85, 3.4], look: [8.4, 5.0, -4.6], fov: 58, exp: 1.12, hold: true, mlook: [6.4, 5.0, -4.6] },
    { p: 0.925, pos: [5.6, 5.85, -2.8], look: [1.5, 5.4, -2.9], fov: 54, exp: 1.12 },
    { p: 0.965, pos: [3.6, 5.85, -2.6], look: [1.3, 4.95, -5.6], fov: 58, exp: 1.15, hold: true },
    { p: 1.0, pos: [3.3, 5.8, -2.9], look: [1.3, 4.95, -5.6], fov: 56, exp: 1.15, hold: true },
  ],
  assembly: [
    { p: 0.0, pos: [30, 15, 31], look: [-0.5, 3.2, 0], fov: 34, exp: 1.0, hold: true },
    { p: 0.3, pos: [40, 23, 41], look: [-7, 9.2, -3], fov: 38, exp: 1.0, hold: true, mpos: [46, 26, 47], mlook: [-0.5, 8.5, 0] },
    { p: 0.5, pos: [-16, 12, 40], look: [6.5, 6.5, 0], fov: 38, exp: 1.0, hold: true, mpos: [-20, 14, 48], mlook: [-1, 6.5, 0] },
    { p: 0.72, pos: [-34, 9, -24], look: [-2, 3.5, -3], fov: 36, exp: 1.0 },
    { p: 0.94, pos: [-10.5, 1.65, -27.5], look: [-4.2, 3.6, -5], fov: 40, exp: 1.15, hold: true },
    { p: 1.0, pos: [-10.0, 1.62, -26.2], look: [-4.2, 3.6, -5], fov: 40, exp: 1.15, hold: true },
  ],
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Scalar curves driven by the same scroll progress. */
export const curves = {
  door: (p: number) => smooth(0.165, 0.215, p),
  /** Vertical separation of construction layers. */
  explode: (p: number) => smooth(0.06, 0.26, p) * (1 - smooth(0.58, 0.72, p)),
  /** Outward separation of cladding from structure. */
  skins: (p: number) => smooth(0.36, 0.48, p) * (1 - smooth(0.56, 0.66, p)),
  /** 0 = afternoon, 1 = dusk. */
  dusk: (p: number) => smooth(0.62, 0.9, p),
}

const cache = new Map<string, { pos: THREE.CatmullRomCurve3; look: THREE.CatmullRomCurve3 }>()

function splines(name: TrackName, portrait: boolean) {
  const id = `${name}:${portrait}`
  let s = cache.get(id)
  if (!s) {
    const k = tracks[name]
    s = {
      pos: new THREE.CatmullRomCurve3(k.map((f) => new THREE.Vector3(...((portrait && f.mpos) || f.pos))), false, 'centripetal'),
      look: new THREE.CatmullRomCurve3(k.map((f) => new THREE.Vector3(...((portrait && f.mlook) || f.look))), false, 'centripetal'),
    }
    cache.set(id, s)
  }
  return s
}

export type CameraPose = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; exp: number }

export function sample(name: TrackName, p: number, out: CameraPose, portrait = false) {
  const k = tracks[name]
  const s = splines(name, portrait)
  p = Math.min(1, Math.max(0, p))
  let i = 0
  while (i < k.length - 2 && p > k[i + 1].p) i++
  const a = k[i]
  const b = k[i + 1]
  const u = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p || 1)))
  // Ease only into and out of hold keyframes; pass-through keys keep velocity.
  let e: number
  if (a.hold && b.hold) e = u * u * (3 - 2 * u)
  else if (a.hold) e = 2 * u * u - u * u * u
  else if (b.hold) e = u + u * u - u * u * u
  else e = u
  const t = (i + e) / (k.length - 1)
  s.pos.getPoint(t, out.pos)
  s.look.getPoint(t, out.look)
  out.fov = a.fov + (b.fov - a.fov) * e
  out.exp = a.exp + (b.exp - a.exp) * e
  return out
}

