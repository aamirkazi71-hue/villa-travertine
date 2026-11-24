import * as THREE from 'three'

/**
 * Procedural surface textures, drawn once on 2D canvases.
 * Each texture is authored at a known real-world size (metres) so geometry
 * can use world-space UVs and every surface keeps a consistent scale.
 */

let seed = 1337
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const range = (a: number, b: number) => a + (b - a) * rand()

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return { c, ctx }
}

/** Tileable value-noise overlay used to break up flat fills. */
let noiseTile: HTMLCanvasElement | null = null
function getNoise() {
  if (noiseTile) return noiseTile
  const size = 256
  const { c, ctx } = canvas(size, size)
  const img = ctx.createImageData(size, size)
  const grid = 32
  const g: number[] = []
  for (let i = 0; i < grid * grid; i++) g.push(rand())
  const at = (x: number, y: number) => g[((y + grid) % grid) * grid + ((x + grid) % grid)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0
      let amp = 0.5
      let f = 1
      for (let o = 0; o < 4; o++) {
        const fx = (x / size) * grid * f * 0.25
        const fy = (y / size) * grid * f * 0.25
        const ix = Math.floor(fx)
        const iy = Math.floor(fy)
        const tx = fx - ix
        const ty = fy - iy
        const sx = tx * tx * (3 - 2 * tx)
        const sy = ty * ty * (3 - 2 * ty)
        const period = Math.round(grid * f * 0.25)
        const w = (a: number) => ((a % period) + period) % period
        const a = at(w(ix), w(iy))
        const b = at(w(ix + 1), w(iy))
        const cc = at(w(ix), w(iy + 1))
        const d = at(w(ix + 1), w(iy + 1))
        v += amp * (a + (b - a) * sx + (cc - a) * sy + (a - b - cc + d) * sx * sy)
        amp *= 0.5
        f *= 2
      }
      const n = v * 255 + (rand() - 0.5) * 30
      const i = (y * size + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = n
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  noiseTile = c
  return c
}

function overlayNoise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number, mode: GlobalCompositeOperation = 'overlay') {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = mode
  ctx.fillStyle = ctx.createPattern(getNoise(), 'repeat')!
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

function toTexture(c: HTMLCanvasElement, metresX: number, metresY: number, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metresX, 1 / metresY)
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function tint(hex: string, amt: number) {
  const c = new THREE.Color(hex)
  c.offsetHSL(0, 0, amt)
  return `#${c.getHexString()}`
}

/* ---------------------------------------------------------------- stone */

function travertine() {
  const W = 1024
  const H = 1024
  const { c, ctx } = canvas(W, H)
  ctx.fillStyle = '#dacdb6'
  ctx.fillRect(0, 0, W, H)
  overlayNoise(ctx, W, H, 0.3, 'soft-light')
  // Linear bedding: broad, soft tonal bands with a few finer lines, periodic in x so the tile repeats cleanly.
  for (let i = 0; i < 110; i++) {
    const y = rand() * H
    const broad = rand() > 0.35
    const thick = broad ? range(8, 46) : range(0.8, 2.5)
    const light = rand() > 0.5
    const a = broad ? range(0.03, 0.09) : range(0.06, 0.16)
    ctx.strokeStyle = light ? `rgba(242,234,218,${a})` : `rgba(150,128,96,${a})`
    ctx.lineWidth = thick
    const amp = range(1, 6)
    const k = Math.round(range(1, 4))
    const ph = rand() * Math.PI * 2
    for (const oy of [0, -H, H]) {
      ctx.beginPath()
      for (let x = 0; x <= W; x += 16) {
        const yy = y + oy + Math.sin((x / W) * Math.PI * 2 * k + ph) * amp
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
      }
      ctx.stroke()
    }
  }
  // Characteristic open pores, elongated along the bedding.
  for (let i = 0; i < 1500; i++) {
    // Pores cluster along some bedding planes, as in the real stone.
    const x = rand() * W
    const y = rand() > 0.6 ? Math.round((rand() * H) / 60) * 60 + range(-6, 6) : rand() * H
    const w = range(1.5, 9)
    const h = range(0.6, 1.8)
    ctx.fillStyle = `rgba(138,116,86,${range(0.18, 0.45)})`
    for (const ox of [0, -W, W])
      for (const oy of [0, -H, H]) {
        ctx.beginPath()
        ctx.ellipse(x + ox, y + oy, w, h, 0, 0, Math.PI * 2)
        ctx.fill()
      }
  }
  overlayNoise(ctx, W, H, 0.22)
  return c
}

function limestone() {
  // 2.4 m × 2.4 m tile: blocks 1.2 m × 0.4 m, half-bond.
  const W = 1024
  const H = 1024
  const { c, ctx } = canvas(W, H)
  const rows = 6
  const bh = H / rows
  const bw = W / 2
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? bw / 2 : 0
    for (let k = -1; k < 3; k++) {
      const x = k * bw + off
      ctx.fillStyle = tint('#e1d6c2', range(-0.025, 0.02))
      ctx.fillRect(x, r * bh, bw, bh)
      // Fine shell inclusions.
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(150,132,104,${range(0.08, 0.25)})`
        ctx.fillRect(x + rand() * bw, r * bh + rand() * bh, range(1, 3), range(1, 2))
      }
    }
  }
  overlayNoise(ctx, W, H, 0.18)
  // Joints.
  ctx.fillStyle = 'rgba(150,135,112,0.65)'
  for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * bh - 1.5, W, 3)
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? bw / 2 : 0
    for (let k = -1; k < 3; k++) ctx.fillRect(k * bw + off - 1.5, r * bh, 3, bh)
  }
  return c
}

/* --------------------------------------------------------------- timber */

function grainStrokes(ctx: CanvasRenderingContext2D, x0: number, w: number, h: number, base: string, n: number, darkAlpha: number) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * w
    const amp = range(0.5, 3)
    const ph = rand() * 10
    ctx.strokeStyle = rand() > 0.35 ? `rgba(40,24,12,${range(darkAlpha * 0.4, darkAlpha)})` : tint(base, 0.06)
    ctx.lineWidth = range(0.5, 2.2)
    ctx.beginPath()
    for (let y = 0; y <= h; y += 12) {
      const xx = x + Math.sin(y / h * Math.PI * 2 * 2 + ph) * amp
      y === 0 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y)
    }
    ctx.stroke()
  }
}

function oakCladding() {
  // 1.2 m wide, 1.2 m high; 20 battens of 45 mm with 15 mm shadow gaps.
  const W = 1024
  const H = 1024
  const { c, ctx } = canvas(W, H)
  ctx.fillStyle = '#2b1f16'
  ctx.fillRect(0, 0, W, H)
  const n = 20
  const pitch = W / n
  const bw = pitch * 0.75
  for (let i = 0; i < n; i++) {
    const x = i * pitch
    const base = tint('#9a6c43', range(-0.04, 0.04))
    ctx.fillStyle = base
    ctx.fillRect(x, 0, bw, H)
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, 0, bw, H)
    ctx.clip()
    grainStrokes(ctx, x, bw, H, base, 9, 0.35)
    // Soft edge shading for the batten profile.
    const g = ctx.createLinearGradient(x, 0, x + bw, 0)
    g.addColorStop(0, 'rgba(0,0,0,0.18)')
    g.addColorStop(0.2, 'rgba(0,0,0,0)')
    g.addColorStop(0.85, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.25)')
    ctx.fillStyle = g
    ctx.fillRect(x, 0, bw, H)
    ctx.restore()
  }
  overlayNoise(ctx, W, H, 0.12)
  return c
}

function oakFloor() {
  // 1.6 m × 3.2 m tile: 8 boards of 200 mm, staggered butt joints.
  const W = 512
  const H = 1024
  const { c, ctx } = canvas(W, H)
  const n = 8
  const bw = W / n
  for (let i = 0; i < n; i++) {
    const x = i * bw
    let y = -rand() * H * 0.6
    while (y < H) {
      const len = range(H * 0.35, H * 0.7)
      const base = tint('#b48858', range(-0.05, 0.04))
      ctx.fillStyle = base
      ctx.fillRect(x, y, bw, len)
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, bw, len)
      ctx.clip()
      grainStrokes(ctx, x, bw, H, base, 7, 0.22)
      ctx.restore()
      ctx.fillStyle = 'rgba(60,40,22,0.45)'
      ctx.fillRect(x, y, bw, 1.5)
      y += len
    }
    ctx.fillStyle = 'rgba(60,40,22,0.5)'
    ctx.fillRect(x, 0, 1.5, H)
  }
  overlayNoise(ctx, W, H, 0.12)
  return c
}

function walnut() {
  const W = 512
  const H = 1024
  const { c, ctx } = canvas(W, H)
  ctx.fillStyle = '#4e3424'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 140; i++) {
    const x = rand() * W
    ctx.strokeStyle = rand() > 0.5 ? `rgba(20,10,4,${range(0.12, 0.4)})` : `rgba(120,84,56,${range(0.1, 0.28)})`
    ctx.lineWidth = range(0.6, 3.2)
    const amp = range(1.5, 7)
    const ph = rand() * 10
    for (const ox of [0, -W, W]) {
      ctx.beginPath()
      for (let y = 0; y <= H; y += 10) {
        const xx = x + ox + Math.sin((y / H) * Math.PI * 2 * 2 + ph) * amp + Math.sin((y / H) * Math.PI * 2 * 5 + ph) * amp * 0.25
        y === 0 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y)
      }
      ctx.stroke()
    }
  }
  overlayNoise(ctx, W, H, 0.14)
  return c
}

/* ------------------------------------------------------------- surfaces */

function flat(hex: string, noise: number, size = 256) {
  const { c, ctx } = canvas(size, size)
  ctx.fillStyle = hex
  ctx.fillRect(0, 0, size, size)
  overlayNoise(ctx, size, size, noise)
  return c
}

function concrete() {
  // 2.4 m × 1.2 m formwork panel with tie holes.
  const W = 1024
  const H = 512
  const { c, ctx } = canvas(W, H)
  ctx.fillStyle = '#a7a39c'
  ctx.fillRect(0, 0, W, H)
  overlayNoise(ctx, W, H, 0.35)
  overlayNoise(ctx, W, H, 0.12, 'multiply')
  ctx.fillStyle = 'rgba(80,76,70,0.35)'
  ctx.fillRect(0, 0, W, 2)
  ctx.fillRect(0, 0, 2, H)
  ctx.fillStyle = 'rgba(70,66,60,0.5)'
  for (const x of [W * 0.25, W * 0.75]) for (const y of [H * 0.25, H * 0.75]) {
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

function lawn() {
  const W = 1024
  const { c, ctx } = canvas(W, W)
  ctx.fillStyle = '#626b48'
  ctx.fillRect(0, 0, W, W)
  overlayNoise(ctx, W, W, 0.28)
  // Individual blades: short strokes in mixed greens with a little straw.
  for (let i = 0; i < 26000; i++) {
    const x = rand() * W
    const y = rand() * W
    const r = rand()
    ctx.strokeStyle = r > 0.9 ? 'rgba(170,165,110,0.35)' : r > 0.45 ? 'rgba(122,134,82,0.32)' : 'rgba(46,56,30,0.32)'
    ctx.lineWidth = range(0.6, 1.4)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + range(-1.5, 1.5), y - range(2, 6))
    ctx.stroke()
  }
  return c
}

function gravel() {
  const W = 512
  const { c, ctx } = canvas(W, W)
  ctx.fillStyle = '#b9ae9a'
  ctx.fillRect(0, 0, W, W)
  for (let i = 0; i < 11000; i++) {
    const v = range(140, 228)
    const x = rand() * W
    const y = rand() * W
    const rad = range(0.8, 2.6)
    ctx.fillStyle = 'rgba(60,52,42,0.35)'
    ctx.beginPath()
    ctx.arc(x + 0.6, y + 0.8, rad, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgb(${v},${v - 8},${v - 20})`
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fill()
  }
  overlayNoise(ctx, W, W, 0.15)
  return c
}

function foliage() {
  const W = 256
  const { c, ctx } = canvas(W, W)
  ctx.fillStyle = '#4c5634'
  ctx.fillRect(0, 0, W, W)
  for (let i = 0; i < 2600; i++) {
    const l = range(-0.12, 0.1)
    ctx.fillStyle = tint('#5d6942', l)
    ctx.beginPath()
    ctx.ellipse(rand() * W, rand() * W, range(1.5, 4), range(0.8, 2), rand() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

/** Large-format travertine slabs (0.8 m × 0.8 m) with tonal variation and fine joints. */
function travertinePaving(base: HTMLCanvasElement) {
  const W = base.width
  const { c, ctx } = canvas(W, W)
  ctx.drawImage(base, 0, 0)
  const n = 2
  const s = W / n
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = rand() > 0.5 ? `rgba(255,250,238,${range(0.02, 0.08)})` : `rgba(120,100,70,${range(0.02, 0.07)})`
      ctx.fillRect(i * s, j * s, s, s)
    }
  ctx.fillStyle = 'rgba(110,94,70,0.75)'
  for (let k = 0; k <= n; k++) {
    ctx.fillRect(k * s - 1.5, 0, 3, W)
    ctx.fillRect(0, k * s - 1.5, W, 3)
  }
  return c
}

/** Close-weave upholstery: a small basket weave as a height map. */
function weave() {
  const W = 128
  const { c, ctx } = canvas(W, W)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, W, W)
  const cell = 8
  for (let y = 0; y < W; y += cell)
    for (let x = 0; x < W; x += cell) {
      const over = ((x + y) / cell) % 2 === 0
      const g = ctx.createLinearGradient(x, y, over ? x + cell : x, over ? y : y + cell)
      g.addColorStop(0, '#6a6a6a')
      g.addColorStop(0.5, '#b8b8b8')
      g.addColorStop(1, '#6a6a6a')
      ctx.fillStyle = g
      ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
    }
  overlayNoise(ctx, W, W, 0.25)
  return c
}

function ripples() {
  const W = 256
  const { c, ctx } = canvas(W, W)
  const img = ctx.createImageData(W, W)
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const u = (x / W) * Math.PI * 2
      const v = (y / W) * Math.PI * 2
      const h = Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u * 2) * 0.3 + Math.sin(u * 7 - v * 4) * 0.2
      const g = 128 + h * 60
      const i = (y * W + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g
      img.data[i + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  return c
}

/** Fine directional streaks for brushed-metal roughness. */
function brushed() {
  const W = 256
  const { c, ctx } = canvas(W, W)
  ctx.fillStyle = '#6b6b6b'
  ctx.fillRect(0, 0, W, W)
  for (let i = 0; i < 900; i++) {
    const v = range(70, 150)
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`
    ctx.fillRect(0, rand() * W, W, range(0.5, 1.5))
  }
  return c
}

/* ------------------------------------------------- derived surface maps */

function luminance(src: HTMLCanvasElement) {
  const ctx = src.getContext('2d')!
  const { data } = ctx.getImageData(0, 0, src.width, src.height)
  const out = new Float32Array(src.width * src.height)
  for (let i = 0; i < out.length; i++) out[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255
  return out
}

/** Tangent-space normal map from a canvas, treating darker pixels as lower (joints, pores, grain). */
function heightToNormal(src: HTMLCanvasElement, strength: number) {
  const W = src.width
  const H = src.height
  const h = luminance(src)
  const { c, ctx } = canvas(W, H)
  const img = ctx.createImageData(W, H)
  const at = (x: number, y: number) => h[((y + H) % H) * W + ((x + W) % W)]
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) * strength
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * W + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5
      img.data[i + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  return c
}

/** Roughness map: luminance mapped into [lo, hi]; `invert` makes dark areas (pores, joints) rougher. */
function roughnessFrom(src: HTMLCanvasElement, lo: number, hi: number, invert = true) {
  const W = src.width
  const H = src.height
  const h = luminance(src)
  const { c, ctx } = canvas(W, H)
  const img = ctx.createImageData(W, H)
  for (let i = 0; i < h.length; i++) {
    const t = invert ? 1 - h[i] : h[i]
    const v = (lo + (hi - lo) * Math.min(1, Math.max(0, t * 1.4 - 0.2))) * 255
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

export type TextureSet = ReturnType<typeof createTextures>

export function createTextures() {
  const trav = travertine()
  const pave = travertinePaving(trav)
  const lime = limestone()
  const clad = oakCladding()
  const floor = oakFloor()
  const wal = walnut()
  const conc = concrete()
  const plast = flat('#ebe4d8', 0.1, 512)
  const grass = lawn()
  const grav = gravel()
  const wv = weave()
  const lin = (cv: HTMLCanvasElement, x: number, y: number) => toTexture(cv, x, y, false)
  return {
    travertine: toTexture(trav, 1.6, 1.6),
    travertineNormal: lin(heightToNormal(trav, 1.6), 1.6, 1.6),
    travertineRough: lin(roughnessFrom(trav, 0.38, 0.75), 1.6, 1.6),
    paving: toTexture(pave, 1.6, 1.6),
    pavingNormal: lin(heightToNormal(pave, 2.2), 1.6, 1.6),
    pavingRough: lin(roughnessFrom(pave, 0.4, 0.8), 1.6, 1.6),
    limestone: toTexture(lime, 2.4, 2.4),
    limestoneNormal: lin(heightToNormal(lime, 2.4), 2.4, 2.4),
    limestoneRough: lin(roughnessFrom(lime, 0.72, 0.95), 2.4, 2.4),
    oakCladding: toTexture(clad, 1.2, 1.2),
    oakCladdingNormal: lin(heightToNormal(clad, 3.5), 1.2, 1.2),
    oakCladdingRough: lin(roughnessFrom(clad, 0.6, 0.9), 1.2, 1.2),
    oakFloor: toTexture(floor, 1.6, 3.2),
    oakFloorNormal: lin(heightToNormal(floor, 1.4), 1.6, 3.2),
    oakFloorRough: lin(roughnessFrom(floor, 0.32, 0.6), 1.6, 3.2),
    walnut: toTexture(wal, 0.8, 1.6),
    walnutNormal: lin(heightToNormal(wal, 0.9), 0.8, 1.6),
    walnutRough: lin(roughnessFrom(wal, 0.3, 0.55), 0.8, 1.6),
    plaster: toTexture(plast, 2, 2),
    plasterNormal: lin(heightToNormal(plast, 0.8), 2, 2),
    concrete: toTexture(conc, 2.4, 1.2),
    concreteNormal: lin(heightToNormal(conc, 1.5), 2.4, 1.2),
    lawn: toTexture(grass, 5, 5),
    lawnNormal: lin(heightToNormal(grass, 2.5), 5, 5),
    gravel: toTexture(grav, 1.2, 1.2),
    gravelNormal: lin(heightToNormal(grav, 3), 1.2, 1.2),
    foliage: toTexture(foliage(), 1, 1),
    fabric: toTexture(flat('#b9ae9c', 0.2, 128), 0.3, 0.3),
    fabricNormal: lin(heightToNormal(wv, 2.5), 0.05, 0.05),
    waterNormal: lin(heightToNormal(ripples(), 2), 3, 3),
    brushed: lin(brushed(), 0.3, 0.3),
    /** Raw canvases for the material-study section. */
    canvases: { travertine: trav, limestone: lime, oak: clad, walnut: wal },
  }
}
