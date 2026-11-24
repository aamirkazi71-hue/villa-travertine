import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { MaterialSet } from './materials'

/**
 * Villa Travertine — a procedural model of the demonstration residence.
 *
 * Plan (metres, y up, street to +z, garden to −z):
 *   Ground floor  x −12 → 10, z −6 → 6, finished floor +0.45, ceiling +3.85
 *   Living room   x −12 → −3, double height to the roof soffit at +7.40
 *   Upper storey  x −3 → 11, z −6.5 → 6.5, finished floor +4.20
 *   Roof plate    +7.40 → +7.65, projecting 1.6 m past the garden glazing
 *
 * Every mesh is tagged with a construction layer so the engineering sequence
 * can separate the same model along its real build-up.
 */

export type Layer =
  | 'foundation'
  | 'gfFloor'
  | 'gfStructure'
  | 'gfSkin'
  | 'gfGlazing'
  | 'ffSlab'
  | 'ffFloor'
  | 'ffStructure'
  | 'ffSkin'
  | 'ffGlazing'
  | 'roof'
  | 'interior'
  | 'site'
  | 'landscape'
  | 'trees'
  | 'setout'

export type Part = { mesh: THREE.Object3D; layer: Layer; base: THREE.Vector3; out: THREE.Vector3 }
export type Anchor = { pos: THREE.Vector3; layer: Layer }

const GF = 0.45
const GF_CEIL = 3.85
const FF = 4.2
const ROOF = 7.4

type Mat = THREE.Material | THREE.Material[]
type BoxOpts = { out?: [number, number, number]; cast?: boolean; receive?: boolean; parent?: THREE.Object3D }
type Opening = { a: number; b: number; y0: number; y1: number }

export function buildVilla(m: MaterialSet) {
  const root = new THREE.Group()
  root.name = 'villa'
  const parts: Part[] = []
  const anchors: Record<string, Anchor> = {}
  const lights: { light: THREE.Light; day: number; dusk: number }[] = []

  /** Axis-aligned box from min/max corners with world-space UVs (1 unit = 1 m). */
  function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: Mat, layer: Layer, o: BoxOpts = {}) {
    const w = Math.abs(x1 - x0)
    const h = Math.abs(y1 - y0)
    const d = Math.abs(z1 - z0)
    const g = new THREE.BoxGeometry(w, h, d)
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const cz = (z0 + z1) / 2
    worldUV(g, cx, cy, cz)
    const mesh = new THREE.Mesh(g, mat)
    mesh.position.set(cx, cy, cz)
    mesh.castShadow = o.cast ?? true
    mesh.receiveShadow = o.receive ?? true
    ;(o.parent ?? root).add(mesh)
    if (!o.parent) register(mesh, layer, o.out)
    return mesh
  }

  function register(mesh: THREE.Object3D, layer: Layer, out?: [number, number, number]) {
    parts.push({ mesh, layer, base: mesh.position.clone(), out: new THREE.Vector3(...(out ?? [0, 0, 0])) })
  }

  /** Material array for a box: [ +x, −x, +y, −y, +z, −z ]. */
  const faces = (px: THREE.Material, nx: THREE.Material, py: THREE.Material, ny: THREE.Material, pz: THREE.Material, nz: THREE.Material) => [px, nx, py, ny, pz, nz]

  /** Split a wall into solid pieces around rectangular openings. */
  function wallPieces(a0: number, a1: number, y0: number, y1: number, openings: Opening[]) {
    const pieces: { a: number; b: number; y0: number; y1: number }[] = []
    const ops = [...openings].sort((p, q) => p.a - q.a)
    let cursor = a0
    for (const op of ops) {
      if (op.a > cursor) pieces.push({ a: cursor, b: op.a, y0, y1 })
      if (op.y0 > y0) pieces.push({ a: op.a, b: op.b, y0, y1: op.y0 })
      if (op.y1 < y1) pieces.push({ a: op.a, b: op.b, y0: op.y1, y1 })
      cursor = op.b
    }
    if (cursor < a1) pieces.push({ a: cursor, b: a1, y0, y1 })
    return pieces
  }

  /**
   * Exterior wall running along X at `line`, with the cladding on the `side` face.
   * The structural core sits inboard of the line; the cladding skin sits outboard.
   */
  function extWallX(line: number, side: 1 | -1, x0: number, x1: number, y0: number, y1: number, ops: Opening[], skin: THREE.Material, inner: THREE.Material, coreLayer: Layer, skinLayer: Layer, skinY0 = y0) {
    const T = 0.3
    const S = 0.06
    const coreFaces = side === 1 ? faces(skin, skin, skin, skin, m.concrete, inner) : faces(skin, skin, skin, skin, inner, m.concrete)
    for (const p of wallPieces(x0, x1, y0, y1, ops)) {
      const za = line
      const zb = line - side * T
      box(p.a, p.y0, Math.min(za, zb), p.b, p.y1, Math.max(za, zb), coreFaces, coreLayer)
    }
    for (const p of wallPieces(x0, x1, skinY0, y1, ops.map((o) => ({ ...o, y0: o.y0 === y0 ? skinY0 : o.y0 })))) {
      const za = line
      const zb = line + side * S
      box(p.a, p.y0, Math.min(za, zb), p.b, p.y1, Math.max(za, zb), skin, skinLayer, { out: [0, 0, side] })
    }
  }

  function extWallZ(line: number, side: 1 | -1, z0: number, z1: number, y0: number, y1: number, ops: Opening[], skin: THREE.Material, inner: THREE.Material, coreLayer: Layer, skinLayer: Layer, skinY0 = y0) {
    const T = 0.3
    const S = 0.06
    const coreFaces = side === 1 ? faces(m.concrete, inner, skin, skin, skin, skin) : faces(inner, m.concrete, skin, skin, skin, skin)
    for (const p of wallPieces(z0, z1, y0, y1, ops)) {
      const xa = line
      const xb = line - side * T
      box(Math.min(xa, xb), p.y0, p.a, Math.max(xa, xb), p.y1, p.b, coreFaces, coreLayer)
    }
    for (const p of wallPieces(z0, z1, skinY0, y1, ops.map((o) => ({ ...o, y0: o.y0 === y0 ? skinY0 : o.y0 })))) {
      const xa = line
      const xb = line + side * S
      box(Math.min(xa, xb), p.y0, p.a, Math.max(xa, xb), p.y1, p.b, skin, skinLayer, { out: [side, 0, 0] })
    }
  }

  /** Interior partition along X or Z with openings. */
  function partition(axis: 'x' | 'z', c0: number, c1: number, a0: number, a1: number, y0: number, y1: number, ops: Opening[], mat: Mat, layer: Layer) {
    for (const p of wallPieces(a0, a1, y0, y1, ops)) {
      if (axis === 'x') box(p.a, p.y0, c0, p.b, p.y1, c1, mat, layer)
      else box(c0, p.y0, p.a, c1, p.y1, p.b, mat, layer)
    }
  }

  /** Glazing along X: glass plus a slim bronze frame, mullions and optional transoms. */
  function glazingX(z: number, x0: number, x1: number, y0: number, y1: number, bays: number, layer: Layer, out: 1 | -1, transoms: number[] = [], fin = 0.14) {
    const glass = box(x0, y0, z - 0.012, x1, y1, z + 0.012, m.glass, layer, { cast: false, receive: false, out: [0, 0, out] })
    glass.renderOrder = 2
    const f = 0.05
    box(x0, y0, z - fin / 2, x1, y0 + f, z + fin / 2, m.bronze, layer, { out: [0, 0, out] })
    box(x0, y1 - f, z - fin / 2, x1, y1, z + fin / 2, m.bronze, layer, { out: [0, 0, out] })
    for (let i = 0; i <= bays; i++) {
      const x = x0 + ((x1 - x0) * i) / bays
      box(x - f / 2, y0, z - fin / 2, x + f / 2, y1, z + fin / 2, m.bronze, layer, { out: [0, 0, out] })
    }
    for (const t of transoms) box(x0, t - f / 2, z - fin / 2, x1, t + f / 2, z + fin / 2, m.bronze, layer, { out: [0, 0, out] })
  }

  function glazingZ(x: number, z0: number, z1: number, y0: number, y1: number, bays: number, layer: Layer, out: 1 | -1, fin = 0.14) {
    const glass = box(x - 0.012, y0, z0, x + 0.012, y1, z1, m.glass, layer, { cast: false, receive: false, out: [out, 0, 0] })
    glass.renderOrder = 2
    const f = 0.05
    box(x - fin / 2, y0, z0, x + fin / 2, y0 + f, z1, m.bronze, layer, { out: [out, 0, 0] })
    box(x - fin / 2, y1 - f, z0, x + fin / 2, y1, z1, m.bronze, layer, { out: [out, 0, 0] })
    for (let i = 0; i <= bays; i++) {
      const zz = z0 + ((z1 - z0) * i) / bays
      box(x - fin / 2, y0, zz - f / 2, x + fin / 2, y1, zz + f / 2, m.bronze, layer, { out: [out, 0, 0] })
    }
  }

  function light(x: number, y: number, z: number, day: number, dusk: number, distance = 14, color = '#ffd7a8') {
    const l = new THREE.PointLight(color, day, distance, 2)
    l.position.set(x, y, z)
    root.add(l)
    lights.push({ light: l, day, dusk })
    return l
  }


  /** Positions for potted plants; the engine grows them with the same leaf cards as the garden trees. */
  const plants: { x: number; y: number; z: number; s: number }[] = []
  /** Elements the engine animates while the camera rests. */
  const curtains: { mesh: THREE.Mesh; width: number; height: number }[] = []
  const flames: THREE.Mesh[] = []

  /** Bevelled box from min/max corners (furniture, fittings). */
  function rbox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: Mat, r = 0.012, layer: Layer = 'interior') {
    const w = Math.abs(x1 - x0)
    const h = Math.abs(y1 - y0)
    const d = Math.abs(z1 - z0)
    const rr = Math.max(0.001, Math.min(r, Math.min(w, h, d) / 2 - 0.0005))
    const g = new RoundedBoxGeometry(w, h, d, 3, rr)
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const cz = (z0 + z1) / 2
    worldUV(g, cx, cy, cz)
    const mesh = new THREE.Mesh(g, mat)
    mesh.position.set(cx, cy, cz)
    mesh.castShadow = mesh.receiveShadow = true
    root.add(mesh)
    register(mesh, layer)
    return mesh
  }

  /** Bevelled box by centre and size, with optional rotation. */
  function rboxc(cx: number, cy: number, cz: number, w: number, h: number, d: number, mat: Mat, r = 0.012, rot?: [number, number, number]) {
    const mesh = rbox(cx - w / 2, cy - h / 2, cz - d / 2, cx + w / 2, cy + h / 2, cz + d / 2, mat, r)
    if (rot) mesh.rotation.set(...rot)
    return mesh
  }

  /** Turned object from an (radius, height) profile, optionally squashed into an oval. */
  function lathe(profile: [number, number][], mat: THREE.Material, x: number, y: number, z: number, sx = 1, sz = 1, double = false) {
    const g = new THREE.LatheGeometry(profile.map(([r, hh]) => new THREE.Vector2(r, hh)), 64)
    if (sx !== 1 || sz !== 1) {
      g.scale(sx, 1, sz)
      g.computeVertexNormals()
    }
    if (double) mat.side = THREE.DoubleSide
    const mesh = new THREE.Mesh(g, mat)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    root.add(mesh)
    register(mesh, 'interior')
    return mesh
  }

  function cyl(x: number, y0: number, z: number, y1: number, r: number, mat: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, 12), mat)
    mesh.position.set(x, (y0 + y1) / 2, z)
    mesh.castShadow = true
    root.add(mesh)
    register(mesh, 'interior')
    return mesh
  }

  function tube(points: [number, number, number][], r: number, mat: THREE.Material) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 12), mat)
    mesh.castShadow = true
    root.add(mesh)
    register(mesh, 'interior')
    return mesh
  }

  /** A canvas hung on a wall that faces −x, painted procedurally in the house palette. */
  function art(x: number, y0: number, z0: number, y1: number, z1: number, _facing: 'x-', seed: number) {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 640
    const ctx = c.getContext('2d')!
    let s = seed * 9301
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    ctx.fillStyle = '#e9e2d4'
    ctx.fillRect(0, 0, 512, 640)
    const palette = seed === 1 ? ['#b8875a', '#3b3631', '#c9b79a', '#8a5a3c'] : ['#6f7560', '#2e2b28', '#d8cdb8', '#a7764e']
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = palette[i]
      ctx.globalAlpha = 0.85
      for (let k = 0; k < 260; k++) {
        const cx = 120 + i * 90 + rnd() * 120 - 60
        const cy = 140 + ((i * 137) % 360) + rnd() * 160 - 80
        ctx.beginPath()
        ctx.ellipse(cx, cy, 20 + rnd() * 40, 6 + rnd() * 10, rnd() * 0.6 - 0.3, 0, Math.PI * 2)
        ctx.globalAlpha = 0.05 + rnd() * 0.12
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, y1 - y0, z1 - z0), [m.paper, mat, m.paper, m.paper, m.paper, m.paper])
    mesh.position.set(x - 0.02, (y0 + y1) / 2, (z0 + z1) / 2)
    mesh.castShadow = mesh.receiveShadow = true
    root.add(mesh)
    register(mesh, 'interior')
  }

  /** A gathered sheer curtain panel hanging along x. */
  function curtain(x0: number, x1: number, z: number, y0: number, y1: number) {
    const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0, 64, 1)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) / (x1 - x0)) * Math.PI * 2 * 7
      p.setZ(i, Math.sin(u) * 0.05 + Math.sin(u * 2.3) * 0.012)
    }
    g.computeVertexNormals()
    const mesh = new THREE.Mesh(g, m.sheer)
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z)
    curtains.push({ mesh, width: x1 - x0, height: y1 - y0 })
    mesh.renderOrder = 3
    root.add(mesh)
    register(mesh, 'interior')
  }

  /** Dining chair facing local −z: walnut frame, upholstered seat, slightly raked back. */
  function chair(x: number, z: number, rotY: number) {
    const g = new THREE.Group()
    g.position.set(x, GF, z)
    g.rotation.y = rotY
    const part = (cx: number, cy: number, cz: number, w: number, h: number, d: number, mat: Mat, r: number, rx = 0) => {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2 - 0.0005)), mat)
      mesh.position.set(cx, cy, cz)
      mesh.rotation.x = rx
      mesh.castShadow = mesh.receiveShadow = true
      g.add(mesh)
    }
    part(0, 0.44, 0, 0.46, 0.04, 0.44, m.walnut, 0.01)
    part(0, 0.485, -0.01, 0.43, 0.05, 0.4, m.fabricDark, 0.02)
    part(0, 0.74, 0.215, 0.44, 0.4, 0.03, m.walnut, 0.01, 0.1)
    for (const [lx, lz] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) part(lx, 0.21, lz, 0.032, 0.42, 0.032, m.walnut, 0.008)
    root.add(g)
    register(g, 'interior')
  }

  /** Soft daylight from a glazed opening, facing into the room along (dx, dy, dz). */
  function windowLight(x: number, y: number, z: number, w: number, h: number, dx: number, dy: number, dz: number, day: number) {
    const l = new THREE.RectAreaLight('#eaf0f6', day, w, h)
    l.position.set(x, y, z)
    l.lookAt(x + dx, y + dy, z + dz)
    root.add(l)
    lights.push({ light: l, day, dusk: day * 0.08 })
  }

  const anchor = (key: string, x: number, y: number, z: number, layer: Layer = 'interior') => {
    anchors[key] = { pos: new THREE.Vector3(x, y, z), layer }
  }

  /* ============================================================ FOUNDATION + GROUND FLOOR SLAB */

  box(-12.1, -0.3, -6.1, 10.1, 0.3, 6.1, m.concrete, 'foundation')
  // Plinth cladding conceals the slab edge.
  box(-12.16, 0, -6.16, 10.16, 0.3, -6.1, m.limestone, 'foundation')
  box(-12.16, 0, 6.1, 10.16, 0.3, 6.16, m.limestone, 'foundation')
  box(-12.16, 0, -6.1, -12.1, 0.3, 6.1, m.limestone, 'foundation')
  box(10.1, 0, -6.1, 10.16, 0.3, 6.1, m.limestone, 'foundation')
  anchor('eFoundation', 8, 0, 4, 'foundation')

  box(-12, 0.3, -6, 10, 0.4, 6, m.screed, 'gfFloor')
  box(-12, 0.4, -6, 10, GF, 4.8, m.paving, 'gfFloor')
  box(-12, 0.4, 4.8, -3, GF, 6, m.paving, 'gfFloor')
  box(0.6, 0.4, 4.8, 10, GF, 6, m.paving, 'gfFloor')
  anchor('eGfFloor', -10, GF, -4, 'gfFloor')

  // Porch and entrance steps: three risers of 150 mm.
  box(-3, 0.3, 4.8, 0.6, GF, 6.5, m.limestone, 'gfFloor')
  box(-3.2, 0, 6.5, 0.8, 0.3, 6.85, m.limestone, 'site')
  box(-3.4, 0, 6.85, 1.0, 0.15, 7.2, m.limestone, 'site')

  /* ============================================================ GROUND FLOOR WALLS */

  // West wall of the living room (full height).
  extWallZ(-12, -1, -6, 6, 0.3, ROOF, [], m.limestone, m.limestone, 'gfStructure', 'gfSkin', 0)

  // Street wall of the living room with three full-height light slots.
  const slots = [-9.75, -7.5, -5.25].map((c) => ({ a: c - 0.25, b: c + 0.25, y0: GF, y1: 6.9 }))
  extWallX(6, 1, -12.06, -3, 0.3, ROOF, slots, m.limestone, m.limestone, 'gfStructure', 'gfSkin', 0)
  for (const s of slots) {
    const g = box(s.a, s.y0, 5.86, s.b, s.y1, 5.88, m.glass, 'gfGlazing', { cast: false, receive: false, out: [0, 0, 1] })
    g.renderOrder = 2
    box(s.a, s.y0, 5.84, s.a + 0.04, s.y1, 5.9, m.bronze, 'gfGlazing', { out: [0, 0, 1] })
    box(s.b - 0.04, s.y0, 5.84, s.b, s.y1, 5.9, m.bronze, 'gfGlazing', { out: [0, 0, 1] })
  }
  anchor('slots', -7.5, 4.4, 5.7)
  anchor('eGfSkin', -10.6, 2.6, 6.06, 'gfSkin')

  // Recessed porch: hall front wall with door and a sidelight.
  const door = { a: -1.95, b: -0.45, y0: GF, y1: 3.45 }
  const sidelight = { a: -2.75, b: -2.2, y0: GF, y1: 3.45 }
  extWallX(4.8, 1, -3, 0.6, 0.3, GF_CEIL, [door, sidelight], m.limestone, m.plaster, 'gfStructure', 'gfSkin', 0.3)
  {
    const g = box(sidelight.a, GF, 4.62, sidelight.b, 3.45, 4.64, m.glass, 'gfGlazing', { cast: false, receive: false, out: [0, 0, 1] })
    g.renderOrder = 2
    box(sidelight.a, GF, 4.6, sidelight.a + 0.05, 3.45, 4.66, m.bronze, 'gfGlazing', { out: [0, 0, 1] })
    box(sidelight.b - 0.05, GF, 4.6, sidelight.b, 3.45, 4.66, m.bronze, 'gfGlazing', { out: [0, 0, 1] })
  }
  // Porch returns.
  box(-3, 0.3, 4.8, -2.7, GF_CEIL, 6, faces(m.limestone, m.limestone, m.limestone, m.limestone, m.limestone, m.limestone), 'gfStructure')
  box(0.54, GF, 4.8, 0.6, GF_CEIL, 6, m.limestone, 'gfSkin', { out: [1, 0, 0] })
  // Porch soffit (underside of the upper storey) in oak.
  box(-3, GF_CEIL - 0.02, 4.8, 0.6, GF_CEIL, 6.5, m.oakCladding, 'ffSkin', { out: [0, 0, 1] })
  anchor('porch', -1.2, 3.6, 6.2)

  // Kitchen street wall with a clerestory above the joinery.
  extWallX(6, 1, 0.6, 10.06, 0.3, GF_CEIL, [{ a: 2.6, b: 9.6, y0: 3.25, y1: 3.7 }], m.limestone, m.plaster, 'gfStructure', 'gfSkin', 0)
  {
    const g = box(2.6, 3.25, 5.84, 9.6, 3.7, 5.86, m.glass, 'gfGlazing', { cast: false, receive: false, out: [0, 0, 1] })
    g.renderOrder = 2
  }

  // East wall with the dining window.
  extWallZ(10, 1, -6, 6, 0.3, GF_CEIL, [{ a: -5.4, b: -1.6, y0: GF, y1: 3.6 }], m.limestone, m.plaster, 'gfStructure', 'gfSkin', 0)
  glazingZ(9.85, -5.4, -1.6, GF, 3.6, 2, 'gfGlazing', 1)

  // Garden glazing: living room (full height, with a transom at the upper floor line) and kitchen.
  glazingX(-6, -12, -3, GF, ROOF, 6, 'gfGlazing', -1, [4.0], 0.2)
  anchor('glazing', -9.6, 2.6, -6)
  glazingX(-6, -2.7, 10, GF, GF_CEIL, 5, 'gfGlazing', -1)
  // Slender steel columns on the kitchen glazing line carry the upper storey.
  for (const x of [2.4, 6.2]) box(x - 0.07, GF, -5.85, x + 0.07, GF_CEIL, -5.71, m.steel, 'gfStructure')
  anchor('columns', 6.2, 2.4, -5.78, 'gfStructure')

  // The spine wall: one limestone plane through both storeys, carrying the stair.
  const spine = faces(m.plaster, m.limestone, m.limestone, m.limestone, m.limestone, m.limestone)
  box(-3, 0.3, -6, -2.7, FF, 0.8, spine, 'gfStructure')
  partition('z', -3, -2.7, -6.5, 0.8, FF, ROOF, [{ a: -5.9, b: -4.9, y0: FF, y1: 6.6 }], spine, 'ffStructure')
  anchor('spine', -3, 2.6, -4.6)

  // Fireplace breast with a long, low firebox.
  partition('z', -11.7, -11.25, -2.8, 2.8, GF, ROOF, [{ a: -2.0, b: 2.0, y0: 0.95, y1: 1.4 }], m.limestone, 'interior')
  box(-11.7, 0.95, -2.0, -11.62, 1.4, 2.0, m.charcoal, 'interior')
  box(-11.62, 0.95, -2.0, -11.25, 0.98, 2.0, m.charcoal, 'interior')
  // Fire: a glowing ember bed with two staggered layers of flame tongues, drawn additively.
  {
    const embers = document.createElement('canvas')
    embers.width = 1024
    embers.height = 64
    const ec = embers.getContext('2d')!
    ec.fillStyle = '#100805'
    ec.fillRect(0, 0, 1024, 64)
    for (let i = 0; i < 1400; i++) {
      const t = Math.random()
      ec.fillStyle = t > 0.7 ? '#ffb347' : t > 0.35 ? '#e8642a' : '#7a2a10'
      ec.globalAlpha = 0.4 + Math.random() * 0.6
      ec.beginPath()
      ec.arc(Math.random() * 1024, Math.random() * 64, 1 + Math.random() * 3, 0, Math.PI * 2)
      ec.fill()
    }
    const et = new THREE.CanvasTexture(embers)
    et.colorSpace = THREE.SRGBColorSpace
    const emberMat = new THREE.MeshStandardMaterial({ color: '#140a06', emissive: '#ffffff', emissiveMap: et, emissiveIntensity: 2.2, roughness: 1 })
    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 3.7), emberMat)
    bed.position.set(-11.53, 1.0, 0)
    root.add(bed)
    register(bed, 'interior')

    const flameCanvas = document.createElement('canvas')
    flameCanvas.width = 1024
    flameCanvas.height = 160
    const fc = flameCanvas.getContext('2d')!
    fc.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 1024
      const w = 10 + Math.random() * 22
      const h = 50 + Math.random() * 100
      const g = fc.createLinearGradient(0, 160, 0, 160 - h)
      g.addColorStop(0, 'rgba(255,240,200,0.9)')
      g.addColorStop(0.25, 'rgba(255,170,60,0.75)')
      g.addColorStop(0.7, 'rgba(230,80,20,0.35)')
      g.addColorStop(1, 'rgba(200,40,10,0)')
      fc.fillStyle = g
      const lean = (Math.random() - 0.5) * 12
      fc.beginPath()
      fc.moveTo(x - w, 160)
      fc.quadraticCurveTo(x - w * 0.8, 160 - h * 0.5, x + lean, 160 - h)
      fc.quadraticCurveTo(x + w * 0.8, 160 - h * 0.5, x + w, 160)
      fc.fill()
    }
    const ft = new THREE.CanvasTexture(flameCanvas)
    ft.colorSpace = THREE.SRGBColorSpace
    const flameMat = new THREE.MeshBasicMaterial({ map: ft, color: new THREE.Color(2.6, 2.2, 1.9), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    for (const [x, off] of [[-11.56, 0], [-11.5, 0.5]] as const) {
      const g = new THREE.PlaneGeometry(3.7, 0.36)
      g.rotateY(Math.PI / 2)
      if (off) {
        const uv = g.attributes.uv
        for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) + off)
        ft.wrapS = THREE.RepeatWrapping
      }
      const plane = new THREE.Mesh(g, flameMat)
      plane.position.set(x, 1.0 + 0.18, 0)
      plane.renderOrder = 4
      plane.userData.noAO = true
      root.add(plane)
      register(plane, 'interior')
      flames.push(plane)
    }
  }
  box(-11.7, GF, -4.6, -10.85, 0.82, 4.6, m.limestone, 'interior')
  anchor('fireplace', -11.25, 1.17, 1.2)
  const fireLight = light(-10.6, 1.1, 0, 0.6, 4, 6, '#ff9a55')

  // WC / coat core between hall and kitchen.
  box(0.6, GF, 1.8, 2.4, GF_CEIL, 6, m.plaster, 'gfStructure')

  /* ============================================================ UPPER STOREY */

  // First-floor slab: structure, screed, finishes.
  box(-2.98, GF_CEIL, -6.5, 11, 4.1, 6.5, faces(m.concrete, m.concrete, m.concrete, m.plaster, m.concrete, m.concrete), 'ffSlab')
  anchor('eFfSlab', 10.6, 3.95, -5, 'ffSlab')
  box(-2.7, 4.1, -6.2, 10.7, 4.17, 6.2, m.screed, 'ffFloor')
  box(-2.7, 4.17, -6.2, -0.35, FF, 6.2, m.oak, 'ffFloor')
  box(-0.35, 4.17, 0, 4.0, FF, 6.2, m.oak, 'ffFloor')
  box(-0.35, 4.17, -6.2, 4.0, FF, 0, m.paving, 'ffFloor')
  box(4.0, 4.17, -6.2, 10.7, FF, 6.2, m.oak, 'ffFloor')
  anchor('eFfFloor', 9, FF, 4.5, 'ffFloor')

  // Oak-clad walls.
  extWallX(6.5, 1, -3, 11.06, 4.1, ROOF, [{ a: 0, b: 3.5, y0: 6.4, y1: 6.9 }], m.oakCladding, m.plaster, 'ffStructure', 'ffSkin', GF_CEIL)
  {
    const g = box(0, 6.4, 6.34, 3.5, 6.9, 6.36, m.glass, 'ffGlazing', { cast: false, receive: false, out: [0, 0, 1] })
    g.renderOrder = 2
  }
  anchor('eFfSkin', 7.5, 6.2, 6.56, 'ffSkin')
  extWallZ(11, 1, -6.56, 6.5, 4.1, ROOF, [{ a: -3, b: 2, y0: 5.0, y1: 6.6 }], m.oakCladding, m.plaster, 'ffStructure', 'ffSkin', GF_CEIL)
  glazingZ(10.85, -3, 2, 5.0, 6.6, 2, 'ffGlazing', 1)
  const rearOps = [
    { a: -2.5, b: -0.7, y0: FF, y1: 7.3 },
    { a: 0.2, b: 3.4, y0: 4.6, y1: 7.0 },
    { a: 4.6, b: 10.6, y0: FF, y1: 7.3 },
  ]
  extWallX(-6.5, -1, -2.7, 11.06, 4.1, ROOF, rearOps, m.oakCladding, m.plaster, 'ffStructure', 'ffSkin', GF_CEIL)
  glazingX(-6.4, -2.5, -0.7, FF, 7.3, 1, 'ffGlazing', -1)
  glazingX(-6.4, 0.2, 3.4, 4.6, 7.0, 2, 'ffGlazing', -1)
  glazingX(-6.4, 4.6, 10.6, FF, 7.3, 3, 'ffGlazing', -1)
  anchor('bedGlazing', 9.2, 6.3, -6.4)
  // Short closing piece where the upper storey oversails the living room's street wall.
  box(-3, GF_CEIL, 6, -2.7, ROOF, 6.5, m.oakCladding, 'ffStructure')

  // Gallery balustrade overlooking the living room.
  {
    const g = box(-3.02, FF, 0.8, -2.98, FF + 1.1, 6, m.glass, 'ffGlazing', { cast: false, receive: false, out: [-1, 0, 0] })
    g.renderOrder = 2
    box(-3.05, FF - 0.05, 0.8, -2.95, FF + 0.06, 6, m.bronze, 'ffGlazing', { out: [-1, 0, 0] })
  }
  anchor('gallery', -3.0, 4.9, 3.2)

  // Partitions: landing | dressing + bath | bedroom.
  partition('z', -0.5, -0.35, 0, 6.2, FF, ROOF, [{ a: 1.8, b: 3.2, y0: FF, y1: 6.6 }], m.plaster, 'ffStructure')
  partition('z', -0.5, -0.35, -6.2, 0, FF, ROOF, [], faces(m.paving, m.plaster, m.plaster, m.plaster, m.plaster, m.plaster), 'ffStructure')
  box(-0.35, FF, -0.075, 4.0, ROOF, 0.075, faces(m.plaster, m.plaster, m.plaster, m.plaster, m.plaster, m.paving), 'ffStructure')
  partition('z', 4.0, 4.15, 0, 6.2, FF, ROOF, [{ a: 1.8, b: 3.2, y0: FF, y1: 6.6 }], m.plaster, 'ffStructure')
  partition('z', 4.0, 4.15, -6.2, 0, FF, ROOF, [{ a: -3.4, b: -2.2, y0: FF, y1: 6.6 }], faces(m.plaster, m.paving, m.plaster, m.plaster, m.plaster, m.plaster), 'ffStructure')
  // Bathroom lining on the outer wall.
  partition('x', -6.2, -6.17, -0.35, 4.0, FF, ROOF, [{ a: 0.2, b: 3.4, y0: 4.6, y1: 7.0 }], m.paving, 'ffStructure')

  /* ============================================================ ROOF */

  const roofFaces = faces(m.concrete, m.concrete, m.concrete, m.plaster, m.concrete, m.concrete)
  box(-12.6, ROOF, -7.6, -4.0, 7.65, 7.0, roofFaces, 'roof')
  box(-3.0, ROOF, -7.6, 11.5, 7.65, 7.0, roofFaces, 'roof')
  box(-4.0, ROOF, -7.6, -3.0, 7.65, -5.0, roofFaces, 'roof')
  box(-4.0, ROOF, 0.6, -3.0, 7.65, 7.0, roofFaces, 'roof')
  {
    const g = box(-4.0, 7.7, -5.0, -3.0, 7.72, 0.6, m.glass, 'roof', { cast: false, receive: false })
    g.renderOrder = 2
  }
  box(-4.05, 7.65, -5.05, -2.95, 7.72, -5.0, m.charcoal, 'roof')
  box(-4.05, 7.65, 0.6, -2.95, 7.72, 0.65, m.charcoal, 'roof')
  anchor('skylight', -3.5, 7.2, -2.2)
  // Bronze fascia band.
  box(-12.65, 7.36, 7.0, 11.55, 7.74, 7.05, m.bronze, 'roof')
  box(-12.65, 7.36, -7.65, 11.55, 7.74, -7.6, m.bronze, 'roof')
  box(-12.65, 7.36, -7.6, -12.6, 7.74, 7.0, m.bronze, 'roof')
  box(11.5, 7.36, -7.6, 11.55, 7.74, 7.0, m.bronze, 'roof')
  anchor('overhang', -7.5, 7.55, -7.6, 'roof')
  anchor('eRoof', 11.5, 7.6, 3, 'roof')

  /* ============================================================ STAIR */

  // Twenty walnut treads cantilevered from the spine wall, rising toward the garden.
  const RISE = (FF - GF) / 21
  for (let i = 0; i < 20; i++) {
    const zTop = 0.6 - i * 0.28
    const y = GF + (i + 1) * RISE
    rbox(-4.1, y - 0.07, zTop - 0.3, -3.0, y, zTop, m.walnut, 0.008)
  }
  box(-4.1, 4.0, -5.9, -3.0, FF, -5.0, m.walnut, 'interior')
  // Frameless glass balustrade following the stair pitch, with a bronze shoe.
  {
    const shape = new THREE.BufferGeometry()
    const yb = GF + RISE
    const v = new Float32Array([
      0, yb, 0.6, 0, FF - 0.05, -5.0, 0, FF + 1.0, -5.0,
      0, yb, 0.6, 0, FF + 1.0, -5.0, 0, yb + 1.0, 0.6,
    ])
    shape.setAttribute('position', new THREE.BufferAttribute(v, 3))
    shape.computeVertexNormals()
    const g = new THREE.Mesh(shape, m.glass)
    g.position.x = -4.1
    g.renderOrder = 2
    root.add(g)
    register(g, 'interior')
    const len = Math.hypot(5.6, FF - 0.05 - yb)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, len), m.bronze)
    rail.position.set(-4.1, (yb + FF - 0.05) / 2 + 1.0, (0.6 - 5.0) / 2)
    rail.rotation.x = Math.atan2(FF - 0.05 - yb, 5.6)
    root.add(rail)
    register(rail, 'interior')
  }
  anchor('stair', -3.9, 2.3, -1.9)
  light(-3.6, 6.8, -2.2, 3, 10, 9)

  /* ============================================================ DOOR */

  // Oak pivot door, 1.5 m × 3.0 m, pivot 300 mm in from the hinge side.
  const doorPivot = new THREE.Group()
  doorPivot.position.set(door.a + 0.3, GF, 4.66)
  root.add(doorPivot)
  register(doorPivot, 'gfSkin', [0, 0, 1])
  {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.48, 2.99, 0.08), m.oakCladding)
    worldUV(leaf.geometry as THREE.BoxGeometry, 0, 0, 0)
    leaf.position.set(1.48 / 2 - 0.3, 1.5, 0)
    leaf.castShadow = leaf.receiveShadow = true
    doorPivot.add(leaf)
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.6, 0.05), m.bronze)
    pull.position.set(1.48 - 0.3 - 0.18, 1.45, 0.08)
    pull.castShadow = true
    doorPivot.add(pull)
    const pullIn = pull.clone()
    pullIn.position.z = -0.08
    doorPivot.add(pullIn)
  }

  /* ============================================================ INTERIORS */

  // Furniture and fittings use bevelled geometry: real objects never have perfectly sharp arrises,
  // and the soft highlight along each edge is much of what reads as "real".
  const F = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: Mat, r = 0.012) => rbox(x0, y0, z0, x1, y1, z1, mat, r)

  /* ---- Living room ---- */
  F(-10.6, GF, -3.6, -5.4, GF + 0.02, 1.8, m.rug, 0.008)
  // Low sofa facing the fireplace: plinth, upholstered frame, loose seat and back cushions.
  F(-6.65, GF, -2.7, -5.9, GF + 0.08, 1.1, m.walnut, 0.01)
  F(-6.8, GF + 0.08, -2.85, -5.75, GF + 0.3, 1.25, m.fabric, 0.04)
  const seats: [number, number][] = [[-2.83, -1.48], [-1.46, -0.11], [-0.09, 1.23]]
  for (const [a, b] of seats) {
    F(-6.76, GF + 0.29, a, -5.98, GF + 0.45, b, m.fabric, 0.06)
    const back = F(-6.04, GF + 0.3, a + 0.02, -5.8, GF + 0.86, b - 0.02, m.fabric, 0.08)
    back.rotation.z = -0.1
  }
  F(-6.8, GF + 0.08, 1.23, -5.75, GF + 0.62, 1.45, m.fabric, 0.07)
  F(-6.8, GF + 0.08, -3.07, -5.75, GF + 0.62, -2.85, m.fabric, 0.07)
  rboxc(-6.12, GF + 0.66, -2.35, 0.16, 0.46, 0.5, m.fabricRust, 0.07, [0, 0.15, -0.32])
  rboxc(-6.14, GF + 0.64, -1.85, 0.15, 0.42, 0.45, m.fabricDark, 0.07, [0, -0.1, -0.3])
  rboxc(-6.12, GF + 0.66, 0.75, 0.16, 0.46, 0.5, m.fabricOlive, 0.07, [0, -0.12, -0.32])
  // Travertine block table with books, a bowl and a vase.
  F(-8.9, GF, -1.4, -7.5, GF + 0.34, 0.2, m.travertine, 0.025)
  rboxc(-8.5, GF + 0.36, -0.95, 0.32, 0.04, 0.24, m.bookA, 0.004, [0, 0.25, 0])
  rboxc(-8.5, GF + 0.395, -0.95, 0.28, 0.03, 0.21, m.bookC, 0.004, [0, 0.05, 0])
  lathe([[0, 0], [0.12, 0], [0.15, 0.03], [0.17, 0.08], [0.16, 0.085], [0.13, 0.04], [0, 0.03]], m.stoneware, -7.95, GF + 0.34, -0.15)
  lathe([[0, 0], [0.06, 0], [0.09, 0.08], [0.1, 0.18], [0.06, 0.3], [0.04, 0.36], [0.05, 0.38], [0, 0.38]], m.ceramic, -8.1, GF + 0.34, -1.1)
  // Pair of lounge chairs: walnut runners, leather seat and back.
  for (const cx of [-9.2, -7.4]) {
    rboxc(cx, GF + 0.31, -3.7, 0.78, 0.13, 0.72, m.leather, 0.05)
    rboxc(cx, GF + 0.63, -4.04, 0.78, 0.52, 0.11, m.leather, 0.05, [-0.2, 0, 0])
    rboxc(cx - 0.38, GF + 0.15, -3.75, 0.05, 0.3, 0.84, m.walnut, 0.015)
    rboxc(cx + 0.38, GF + 0.15, -3.75, 0.05, 0.3, 0.84, m.walnut, 0.015)
  }
  // Floor lamp beside the chairs.
  lathe([[0, 0], [0.16, 0], [0.16, 0.02], [0.02, 0.03], [0, 0.03]], m.bronze, -10.3, GF, -3.7)
  cyl(-10.3, GF + 0.03, -3.7, GF + 1.5, 0.012, m.bronze)
  lathe([[0.2, 0], [0.14, 0.28], [0.135, 0.28], [0.195, 0]], m.shade, -10.3, GF + 1.38, -3.7, 1, 1, true)
  light(-10.3, GF + 1.45, -3.7, 0.4, 3, 6)
  plants.push({ x: -11.1, y: GF, z: -5.1, s: 1.15 })
  lathe([[0, 0], [0.26, 0], [0.3, 0.1], [0.32, 0.55], [0.29, 0.55], [0.27, 0.12], [0, 0.12]], m.stoneware, -11.1, GF, -5.1)

  // Television: a 77-inch panel wall-mounted on the fireplace breast, above the firebox.
  {
    const x = -11.25
    rboxc(x + 0.02, 2.32, 0, 0.03, 0.985, 1.715, m.blackMetal, 0.004)
    const s = box(x + 0.034, 2.32 - 0.47, -0.84, x + 0.036, 2.32 + 0.47, 0.84, m.screen, 'interior')
    s.castShadow = false
    anchor('tv', x + 0.04, 2.32, -0.6)
  }

  // Sculptural ring pendant in the double-height space.
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.035, 16, 128), m.bronze)
    ring.rotation.x = Math.PI / 2
    ring.position.set(-8.2, 4.4, -0.6)
    ring.castShadow = true
    root.add(ring)
    register(ring, 'interior')
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.012, 8, 128), m.lamp)
    glow.rotation.x = Math.PI / 2
    glow.position.set(-8.2, 4.37, -0.6)
    root.add(glow)
    register(glow, 'interior')
    for (const a of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) cyl(-8.2 + Math.cos(a) * 1.25, 4.4, -0.6 + Math.sin(a) * 1.25, ROOF, 0.004, m.steel)
  }
  light(-8.2, 4.0, -0.6, 3, 16, 14)
  light(-7.5, 6.5, 2.5, 2, 6, 14)

  /* ---- Hall ---- */
  F(0.15, GF, 2.3, 0.58, GF + 0.42, 4.2, m.walnut, 0.015)
  lathe([[0, 0], [0.1, 0], [0.16, 0.12], [0.15, 0.3], [0.08, 0.42], [0.09, 0.45], [0, 0.45]], m.stoneware, 0.36, GF + 0.42, 3.8)
  art(0.6, 1.45, 2.5, 2.6, 4.0, 'x-', 1)
  light(-1.2, 3.4, 2.6, 1.2, 6, 8)

  /* ---- Kitchen ---- */
  // Full-height oak joinery with a stone-lined niche; shadow-gap seams between doors.
  box(2.6, GF, 5.4, 4.5, 3.15, 5.7, m.oakCladding, 'interior')
  box(7.5, GF, 5.4, 9.8, 3.15, 5.7, m.oakCladding, 'interior')
  box(4.5, GF, 5.4, 7.5, GF + 0.88, 5.7, m.oakCladding, 'interior')
  box(4.5, 2.4, 5.4, 7.5, 3.15, 5.7, m.oakCladding, 'interior')
  for (const x of [3.233, 3.866, 8.267, 9.033]) box(x - 0.003, GF + 0.1, 5.395, x + 0.003, 3.12, 5.4, m.charcoal, 'interior')
  for (const x of [5.5, 6.5]) box(x - 0.003, GF + 0.1, 5.395, x + 0.003, GF + 0.86, 5.4, m.charcoal, 'interior')
  box(2.6, GF, 5.385, 9.8, GF + 0.1, 5.4, m.charcoal, 'interior')
  F(4.5, GF + 0.88, 5.34, 7.5, GF + 0.92, 5.7, m.travertine, 0.004)
  box(4.5, GF + 0.92, 5.66, 7.5, 2.4, 5.7, m.travertine, 'interior')
  box(4.6, 2.36, 5.45, 7.4, 2.4, 5.6, m.lamp, 'interior', { cast: false })
  lathe([[0, 0], [0.07, 0], [0.09, 0.18], [0.07, 0.26], [0, 0.26]], m.stoneware, 5.1, GF + 0.92, 5.55)
  rboxc(6.6, GF + 1.12, 5.62, 0.4, 0.4, 0.03, m.walnut, 0.01, [-0.12, 0, 0])
  anchor('joinery', 3.6, 2.4, 5.4)
  // Island: travertine top with waterfall ends over a walnut body.
  F(3.8, GF + 0.88, 2.4, 8.0, GF + 0.92, 3.5, m.travertine, 0.005)
  F(3.8, GF, 2.4, 3.84, GF + 0.88, 3.5, m.travertine, 0.004)
  F(7.96, GF, 2.4, 8.0, GF + 0.88, 3.5, m.travertine, 0.004)
  box(3.84, GF + 0.1, 2.5, 7.96, GF + 0.88, 3.4, m.walnut, 'interior')
  box(3.9, GF, 2.55, 7.9, GF + 0.1, 3.35, m.charcoal, 'interior')
  // Hob, sink and a bronze tap.
  box(4.3, GF + 0.92, 2.7, 5.1, GF + 0.924, 3.2, m.screen, 'interior')
  box(6.35, GF + 0.92, 2.72, 7.1, GF + 0.922, 3.15, m.charcoal, 'interior')
  tube([[6.72, GF + 0.92, 3.32], [6.72, GF + 1.2, 3.32], [6.72, GF + 1.27, 3.2], [6.72, GF + 1.2, 3.06]], 0.011, m.bronze)
  lathe([[0, 0], [0.15, 0], [0.18, 0.05], [0.19, 0.09], [0.17, 0.09], [0.14, 0.04], [0, 0.03]], m.stoneware, 5.7, GF + 0.92, 3.05)
  for (const [dx, dz] of [[-0.05, 0.02], [0.05, -0.03], [0.0, 0.06]]) {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), m.fabricOlive)
    fruit.position.set(5.7 + dx, GF + 0.99, 3.05 + dz)
    fruit.castShadow = true
    root.add(fruit)
    register(fruit, 'interior')
  }
  anchor('island', 7.4, GF + 0.92, 2.95)
  // Bar stools on the garden side.
  for (const x of [4.6, 5.5, 6.4, 7.3]) {
    rboxc(x, GF + 0.74, 2.0, 0.42, 0.06, 0.38, m.leather, 0.025)
    for (const [dx, dz] of [[-0.16, -0.14], [0.16, -0.14], [-0.16, 0.14], [0.16, 0.14]]) cyl(x + dx, GF, 2.0 + dz, GF + 0.71, 0.012, m.blackMetal)
    rboxc(x, GF + 0.28, 2.14, 0.34, 0.02, 0.02, m.blackMetal, 0.005)
  }
  // Three glass globe pendants over the island.
  for (const x of [4.75, 5.9, 7.05]) {
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 20), m.shade)
    g.position.set(x, 2.25, 2.95)
    root.add(g)
    register(g, 'interior')
    cyl(x, 2.38, 2.95, GF_CEIL, 0.004, m.steel)
  }
  light(5.9, 2.1, 2.95, 2, 8, 8)
  // Walnut dining table for eight.
  F(4.0, GF + 0.7, -3.6, 7.2, GF + 0.75, -2.5, m.walnut, 0.012)
  F(4.5, GF, -3.35, 4.6, GF + 0.7, -2.75, m.walnut, 0.01)
  F(6.6, GF, -3.35, 6.7, GF + 0.7, -2.75, m.walnut, 0.01)
  F(4.6, GF + 0.6, -3.08, 6.6, GF + 0.66, -3.02, m.walnut, 0.008)
  for (const cx of [4.6, 5.6, 6.6]) {
    for (const s of [-1, 1]) chair(cx, s > 0 ? -2.15 : -3.95, s > 0 ? 0 : Math.PI)
  }
  chair(3.7, -3.05, -Math.PI / 2)
  chair(7.5, -3.05, Math.PI / 2)
  lathe([[0, 0], [0.07, 0], [0.1, 0.1], [0.08, 0.3], [0.05, 0.38], [0.06, 0.4], [0, 0.4]], m.stoneware, 5.6, GF + 0.75, -3.05)
  anchor('table', 4.3, GF + 0.75, -2.6)
  // Linear pendant over the table.
  F(4.2, 2.3, -3.1, 7.0, 2.36, -3.0, m.bronze, 0.008)
  box(4.25, 2.29, -3.08, 6.95, 2.3, -3.02, m.lamp, 'interior', { cast: false })
  cyl(4.4, 2.36, -3.05, GF_CEIL, 0.004, m.steel)
  cyl(6.8, 2.36, -3.05, GF_CEIL, 0.004, m.steel)
  light(5.6, 2.1, -3.05, 2.5, 10, 7)
  light(8.6, 3.3, -1.0, 1.5, 6, 9)

  /* ---- Landing ---- */
  F(-2.4, FF, -2.6, -2.0, FF + 0.42, -0.4, m.walnut, 0.015)
  art(-0.5, 5.0, -4.6, 6.5, -2.4, 'x-', 2)
  light(-1.6, 6.9, -2.5, 1.2, 6, 8)

  /* ---- Dressing room ---- */
  box(-0.3, FF, 5.6, 3.9, FF + 2.8, 6.2, m.oakCladding, 'interior')
  for (const x of [0.4, 1.1, 1.8, 2.5, 3.2]) box(x - 0.003, FF + 0.05, 5.595, x + 0.003, FF + 2.78, 5.6, m.charcoal, 'interior')
  F(0.9, FF, 3.4, 2.7, FF + 0.45, 4.0, m.leather, 0.04)
  light(1.8, 6.9, 3.5, 1, 5, 7)

  /* ---- Principal bedroom ---- */
  F(4.15, FF, -2.0, 4.25, FF + 1.5, 1.4, m.walnut, 0.01)
  anchor('headboard', 4.25, FF + 1.3, 1.2)
  F(4.3, FF, -1.3, 6.5, FF + 0.28, 0.7, m.walnut, 0.02)
  F(4.33, FF + 0.28, -1.27, 6.47, FF + 0.5, 0.67, m.linen, 0.05)
  F(4.95, FF + 0.44, -1.38, 6.56, FF + 0.6, 0.78, m.linen, 0.07)
  F(5.85, FF + 0.58, -1.4, 6.5, FF + 0.62, 0.8, m.fabricRust, 0.015)
  rboxc(4.6, FF + 0.68, -0.72, 0.22, 0.2, 0.74, m.linen, 0.09, [0, 0, -0.35])
  rboxc(4.6, FF + 0.68, 0.12, 0.22, 0.2, 0.74, m.linen, 0.09, [0, 0, -0.35])
  rboxc(4.82, FF + 0.66, -0.3, 0.14, 0.32, 0.46, m.fabricOlive, 0.06, [0, 0.1, -0.3])
  for (const z of [-1.72, 1.12]) {
    F(4.3, FF, z - 0.23, 4.75, FF + 0.45, z + 0.23, m.walnut, 0.015)
    lathe([[0, 0], [0.07, 0], [0.09, 0.08], [0.07, 0.24], [0.02, 0.3], [0, 0.3]], m.ceramic, 4.52, FF + 0.45, z)
    lathe([[0.15, 0], [0.13, 0.2], [0.125, 0.2], [0.145, 0]], m.shade, 4.52, FF + 0.72, z, 1, 1, true)
    light(4.52, FF + 0.82, z, 0.3, 2.2, 4)
  }
  rboxc(4.55, FF + 0.47, 1.25, 0.22, 0.03, 0.16, m.bookB, 0.004, [0, 0.4, 0])
  F(6.75, FF, -1.0, 7.2, FF + 0.42, 0.4, m.leather, 0.04)
  F(4.9, FF, -2.2, 8.4, FF + 0.02, 1.9, m.rug, 0.008)
  // Reading chair and side table at the garden glazing.
  rboxc(9.0, FF + 0.32, -5.15, 0.8, 0.16, 0.76, m.fabric, 0.06)
  rboxc(9.0, FF + 0.66, -5.5, 0.8, 0.56, 0.14, m.fabric, 0.06, [-0.18, 0, 0])
  rboxc(8.62, FF + 0.4, -5.2, 0.08, 0.36, 0.76, m.fabric, 0.04)
  rboxc(9.38, FF + 0.4, -5.2, 0.08, 0.36, 0.76, m.fabric, 0.04)
  lathe([[0, 0], [0.2, 0], [0.2, 0.03], [0.03, 0.04], [0.03, 0.5], [0.22, 0.5], [0.22, 0.53], [0, 0.53]], m.walnut, 9.85, FF, -4.7)
  // Sheer linen curtains gathered at each end of the glazing, on a slim track.
  curtain(4.65, 5.65, -6.12, FF + 0.02, 7.28)
  curtain(9.55, 10.55, -6.12, FF + 0.02, 7.28)
  box(4.6, 7.3, -6.16, 10.6, 7.33, -6.1, m.blackMetal, 'interior', { cast: false })
  light(6.2, 6.9, -0.4, 1.2, 5, 9)
  light(8.6, 6.9, -3.6, 1.0, 4, 9)

  /* ---- Bathroom ---- */
  // Freestanding oval bath: a turned profile with a real hollow, scaled to 1.8 m × 0.8 m.
  lathe(
    [[0, 0], [0.78, 0], [0.9, 0.03], [0.97, 0.12], [1.0, 0.5], [0.995, 0.56], [0.96, 0.575], [0.93, 0.555], [0.9, 0.2], [0.8, 0.1], [0, 0.09]],
    m.ceramic, 1.8, FF, -5.45, 0.9, 0.4,
  )
  {
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.89, 64), m.bathWater)
    w.geometry.rotateX(-Math.PI / 2)
    w.geometry.scale(0.9, 1, 0.4)
    w.position.set(1.8, FF + 0.42, -5.45)
    root.add(w)
    register(w, 'interior')
  }
  tube([[2.85, FF, -5.45], [2.85, FF + 0.9, -5.45], [2.8, FF + 0.98, -5.45], [2.68, FF + 0.92, -5.45]], 0.014, m.bronze)
  anchor('tub', 1.0, FF + 0.56, -5.2)
  // Folded towels on a walnut stool.
  F(0.15, FF, -5.6, 0.55, FF + 0.42, -5.2, m.walnut, 0.015)
  F(0.18, FF + 0.42, -5.58, 0.52, FF + 0.47, -5.22, m.linen, 0.02)
  F(0.2, FF + 0.47, -5.56, 0.5, FF + 0.52, -5.24, m.linen, 0.02)
  // Floating vanity, two turned basins, wall-mounted taps, a back-lit mirror.
  F(0.4, FF + 0.8, -0.6, 3.4, FF + 0.88, -0.075, m.travertine, 0.006)
  F(0.5, FF + 0.6, -0.55, 3.3, FF + 0.8, -0.075, m.walnut, 0.01)
  for (const x of [1.25, 2.55]) {
    lathe([[0, 0], [0.12, 0], [0.19, 0.06], [0.2, 0.13], [0.185, 0.13], [0.17, 0.07], [0, 0.02]], m.ceramic, x, FF + 0.88, -0.35)
    tube([[x, FF + 1.18, -0.08], [x, FF + 1.18, -0.2], [x, FF + 1.15, -0.25]], 0.01, m.bronze)
  }
  box(0.6, FF + 1.25, -0.11, 3.2, FF + 2.25, -0.075, m.mirror, 'interior')
  box(0.65, FF + 1.24, -0.075, 3.15, FF + 1.25, -0.06, m.lamp, 'interior', { cast: false })
  box(0.65, FF + 2.25, -0.075, 3.15, FF + 2.26, -0.06, m.lamp, 'interior', { cast: false })
  anchor('vanity', 3.4, FF + 0.88, -0.4)
  plants.push({ x: 3.6, y: FF, z: -5.75, s: 0.55 })
  lathe([[0, 0], [0.15, 0], [0.18, 0.3], [0.16, 0.3], [0.14, 0.05], [0, 0.05]], m.stoneware, 3.6, FF, -5.75)
  light(1.8, 6.9, -3.0, 1.2, 6, 8)

  /* ---- Daylight through the glazing ---- */
  // Soft area lights in each large opening stand in for skylight bounce, which real-time
  // rendering cannot compute: they give interiors their directional, window-lit falloff.
  windowLight(-7.5, 3.9, -5.85, 8.8, 6.8, 0, 0, 1, 1.1)
  windowLight(3.6, 2.15, -5.85, 12.4, 3.3, 0, 0, 1, 0.9)
  windowLight(9.8, 2.05, -3.5, 3.7, 3.0, -1, 0, 0, 0.7)
  windowLight(7.6, 5.75, -6.3, 6.0, 3.0, 0, 0, 1, 0.9)
  windowLight(1.8, 5.8, -6.1, 3.1, 2.3, 0, 0, 1, 0.8)
  windowLight(-1.6, 5.75, -6.3, 1.8, 3.0, 0, 0, 1, 0.6)
  windowLight(-7.5, 3.6, 5.8, 5.5, 6.0, 0, 0, -1, 0.35)

  /* ============================================================ SETTING-OUT (used by stage renders) */

  {
    const pts = [
      [-12, 6], [-3, 6], [-3, 4.8], [0.6, 4.8], [0.6, 6], [10, 6], [10, -6], [-12, -6], [-12, 6],
    ].map(([x, z]) => new THREE.Vector3(x, 0.03, z))
    const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m.line)
    root.add(outline)
    register(outline, 'setout')
    const grid: THREE.Vector3[] = []
    for (const x of [-12, -3, 0.6, 10]) grid.push(new THREE.Vector3(x, 0.03, -9), new THREE.Vector3(x, 0.03, 9))
    for (const z of [-6, 6]) grid.push(new THREE.Vector3(-15, 0.03, z), new THREE.Vector3(13, 0.03, z))
    const gl = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(grid), m.line)
    root.add(gl)
    register(gl, 'setout')
  }

  return { root, parts, anchors, lights, doorPivot, plants, curtains, flames, fireLight }
}

/** Replace box UVs so 1 unit = 1 m in world space, continuous across adjacent boxes. */
export function worldUV(g: THREE.BoxGeometry, cx: number, cy: number, cz: number) {
  const pos = g.attributes.position
  const nrm = g.attributes.normal
  const uv = g.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx
    const y = pos.getY(i) + cy
    const z = pos.getZ(i) + cz
    const nx = Math.abs(nrm.getX(i))
    const ny = Math.abs(nrm.getY(i))
    if (nx > 0.5) uv.setXY(i, z, y)
    else if (ny > 0.5) uv.setXY(i, x, z)
    else uv.setXY(i, x, y)
  }
  uv.needsUpdate = true
}
