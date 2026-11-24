import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Trees built the way real-time foliage is built for film and games:
 * — canopies are clouds of alpha-tested leaf-cluster cards, never solid shapes;
 * — each card's normal points out of the crown, so the canopy is lit as one soft
 *   volume instead of hundreds of randomly facing planes;
 * — vertex colour darkens cards deep inside and under the crown (a cheap occlusion);
 * — trunks fork into limbs that reach into separate leaf clusters.
 */

export type Species = 'olive' | 'canopy'

type Rand = () => number

/* ------------------------------------------------------------ leaf atlases */

function leafCanvas(species: Species, rand: Rand) {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  const olive = species === 'olive'
  // A twig through the card, with leaves arranged along it and around the edge of the cluster.
  ctx.strokeStyle = olive ? 'rgba(90,82,66,0.9)' : 'rgba(70,58,42,0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(S * 0.5, S * 0.98)
  ctx.quadraticCurveTo(S * 0.46, S * 0.6, S * 0.52, S * 0.12)
  ctx.stroke()
  const count = olive ? 170 : 120
  for (let i = 0; i < count; i++) {
    // Leaves gather toward the cluster centre and thin out at the edges.
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * S * 0.42
    const x = S * 0.5 + Math.cos(a) * r
    const y = S * 0.5 + Math.sin(a) * r * 1.05
    const len = olive ? S * (0.05 + rand() * 0.04) : S * (0.06 + rand() * 0.05)
    const wid = olive ? len * 0.22 : len * 0.55
    const l = olive ? 34 + rand() * 22 : 22 + rand() * 22
    const sat = olive ? 10 + rand() * 12 : 28 + rand() * 22
    const hue = olive ? 75 + rand() * 20 : 85 + rand() * 25
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a + Math.PI / 2 + (rand() - 0.5) * 1.2)
    const g = ctx.createLinearGradient(-wid, 0, wid, 0)
    g.addColorStop(0, `hsl(${hue}, ${sat}%, ${l - 6}%)`)
    g.addColorStop(0.5, `hsl(${hue}, ${sat}%, ${l + 6}%)`)
    g.addColorStop(1, `hsl(${hue}, ${sat}%, ${l - 4}%)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, -len)
    ctx.quadraticCurveTo(wid, -len * 0.2, 0, len)
    ctx.quadraticCurveTo(-wid, -len * 0.2, 0, -len)
    ctx.fill()
    // Midrib.
    ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${l + 14}%, 0.35)`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(0, -len * 0.9)
    ctx.lineTo(0, len * 0.9)
    ctx.stroke()
    ctx.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function createFoliageMaterials(rand: Rand) {
  const mk = (species: Species, color: string) =>
    new THREE.MeshStandardMaterial({
      map: leafCanvas(species, rand),
      alphaTest: 0.45,
      alphaToCoverage: true,
      side: THREE.DoubleSide,
      vertexColors: true,
      roughness: 0.78,
      color,
    })
  return {
    olive: mk('olive', '#d8dccb'),
    canopy: mk('canopy', '#c8cdb8'),
    bark: new THREE.MeshStandardMaterial({ color: '#4b4640', roughness: 1 }),
    barkOlive: new THREE.MeshStandardMaterial({ color: '#5e5a52', roughness: 1 }),
  }
}

/* ---------------------------------------------------------------- canopy */

type Blob = { c: THREE.Vector3; r: THREE.Vector3 }

/** Leaf cards distributed through a set of ellipsoidal clusters, merged into one geometry. */
function canopyGeometry(blobs: Blob[], cards: number, size: [number, number], rand: Rand, centre: THREE.Vector3, radius: number) {
  const pos = new Float32Array(cards * 4 * 3)
  const nrm = new Float32Array(cards * 4 * 3)
  const uv = new Float32Array(cards * 4 * 2)
  const col = new Float32Array(cards * 4 * 3)
  const idx: number[] = []
  const p = new THREE.Vector3()
  const out = new THREE.Vector3()
  const n = new THREE.Vector3()
  const q = new THREE.Quaternion()
  const right = new THREE.Vector3()
  const up = new THREE.Vector3()
  const totalVol = blobs.reduce((s, b) => s + b.r.x * b.r.y * b.r.z, 0)
  let k = 0
  for (const b of blobs) {
    const share = Math.round((cards * b.r.x * b.r.y * b.r.z) / totalVol)
    for (let i = 0; i < share && k < cards; i++, k++) {
      // Bias toward the shell: foliage lives where the light is.
      out.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize()
      const d = 0.55 + 0.45 * Math.pow(rand(), 0.5)
      p.set(out.x * b.r.x * d, out.y * b.r.y * d, out.z * b.r.z * d).add(b.c)
      // Lighting normal: out of the whole crown, lifted slightly toward the sky.
      n.copy(p).sub(centre).normalize().lerp(new THREE.Vector3(0, 1, 0), 0.25).normalize()
      // Card faces roughly outward with a random twist and tilt, so silhouettes stay irregular.
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), out.clone().lerp(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5), 0.6).normalize())
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() * Math.PI * 2))
      const s = size[0] + (size[1] - size[0]) * rand()
      right.set(s / 2, 0, 0).applyQuaternion(q)
      up.set(0, s / 2, 0).applyQuaternion(q)
      // Fake occlusion: deeper and lower cards are darker; a little hue variation per card.
      const depth = Math.min(1, p.distanceTo(centre) / radius)
      const low = THREE.MathUtils.clamp((p.y - (centre.y - radius)) / (2 * radius), 0, 1)
      const shade = 0.42 + 0.48 * depth * (0.6 + 0.4 * low)
      const warm = 0.94 + rand() * 0.12
      const corners = [
        [-1, -1, 0, 0],
        [1, -1, 1, 0],
        [1, 1, 1, 1],
        [-1, 1, 0, 1],
      ]
      corners.forEach(([sx, sy, u, v], j) => {
        const o = (k * 4 + j) * 3
        pos[o] = p.x + right.x * sx + up.x * sy
        pos[o + 1] = p.y + right.y * sx + up.y * sy
        pos[o + 2] = p.z + right.z * sx + up.z * sy
        nrm[o] = n.x
        nrm[o + 1] = n.y
        nrm[o + 2] = n.z
        col[o] = shade * warm
        col[o + 1] = shade
        col[o + 2] = shade * (2 - warm)
        uv[(k * 4 + j) * 2] = u
        uv[(k * 4 + j) * 2 + 1] = v
      })
      const b0 = k * 4
      idx.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, k * 12), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nrm.subarray(0, k * 12), 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv.subarray(0, k * 8), 2))
  g.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, k * 12), 3))
  g.setIndex(idx)
  g.computeBoundingSphere()
  return g
}

/** A tapered limb from a to b. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number) {
  const len = a.distanceTo(b)
  const g = new THREE.CylinderGeometry(r1, r0, len, 7, 1)
  g.translate(0, len / 2, 0)
  const dir = b.clone().sub(a).normalize()
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir))
  g.translate(a.x, a.y, a.z)
  return g
}

/** Branch and canopy geometry for one tree, in local space with the root at the origin. */
function treeGeometry(species: Species, scale: number, rand: Rand, detail: number) {
  const limbs: THREE.BufferGeometry[] = []
  const blobs: Blob[] = []
  if (species === 'olive') {
    // Multi-stemmed, gnarled, wider than tall; small leaves in airy clusters.
    const stems = 3
    const top = 2.3 * scale
    for (let i = 0; i < stems; i++) {
      const a = (i / stems) * Math.PI * 2 + rand() * 0.8
      const lean = 0.5 + rand() * 0.35
      const mid = new THREE.Vector3(Math.cos(a) * 0.25 * scale, top * 0.45, Math.sin(a) * 0.25 * scale)
      const end = new THREE.Vector3(Math.cos(a) * lean * 1.5 * scale, top * (0.95 + rand() * 0.25), Math.sin(a) * lean * 1.5 * scale)
      limbs.push(limb(new THREE.Vector3(0, 0, 0), mid, 0.13 * scale, 0.09 * scale))
      limbs.push(limb(mid, end, 0.09 * scale, 0.035 * scale))
      for (let j = 0; j < 2; j++) {
        const c = end.clone().add(new THREE.Vector3((rand() - 0.5) * 1.1 * scale, 0.35 * scale + rand() * 0.45 * scale, (rand() - 0.5) * 1.1 * scale))
        blobs.push({ c, r: new THREE.Vector3(1.05, 0.62, 1.05).multiplyScalar(scale * (0.8 + rand() * 0.35)) })
        limbs.push(limb(end, c, 0.035 * scale, 0.012 * scale))
      }
    }
  } else {
    // Single trunk, branching at mid-height into a rounded crown.
    const h = 4.2 * scale
    const fork = new THREE.Vector3((rand() - 0.5) * 0.3, h * 0.55, (rand() - 0.5) * 0.3)
    limbs.push(limb(new THREE.Vector3(0, 0, 0), fork, 0.2 * scale, 0.14 * scale))
    const n = 6
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.6
      const reach = (0.9 + rand() * 0.9) * scale
      const end = new THREE.Vector3(Math.cos(a) * reach, h * (0.85 + rand() * 0.45), Math.sin(a) * reach)
      limbs.push(limb(fork, end, 0.12 * scale, 0.04 * scale))
      blobs.push({ c: end.clone().add(new THREE.Vector3(0, 0.4 * scale, 0)), r: new THREE.Vector3(1.35, 1.1, 1.35).multiplyScalar(scale * (0.8 + rand() * 0.35)) })
    }
    blobs.push({ c: new THREE.Vector3(0, h * 1.25, 0), r: new THREE.Vector3(1.6, 1.3, 1.6).multiplyScalar(scale) })
  }
  const centre = blobs.reduce((s, b) => s.add(b.c), new THREE.Vector3()).divideScalar(blobs.length)
  const radius = Math.max(...blobs.map((b) => b.c.distanceTo(centre) + Math.max(b.r.x, b.r.y)))
  const olive = species === 'olive'
  const cards = Math.round((olive ? 1700 : 2300) * detail)
  const size: [number, number] = olive ? [0.42 * scale, 0.7 * scale] : [0.6 * scale, 1.0 * scale]
  // Fewer, larger cards at a distance keep the silhouette but cut the cost.
  if (detail < 0.5) {
    size[0] *= 1.8
    size[1] *= 1.8
  }
  return {
    branches: mergeGeometries(limbs),
    canopy: canopyGeometry(blobs, cards, size, rand, centre, radius),
  }
}

/** A single near tree as its own group (so it can sway in the wind). */
export function buildTree(species: Species, scale: number, mats: ReturnType<typeof createFoliageMaterials>, rand: Rand) {
  const g = new THREE.Group()
  const { branches, canopy } = treeGeometry(species, scale, rand, 1)
  const b = new THREE.Mesh(branches, species === 'olive' ? mats.barkOlive : mats.bark)
  b.castShadow = b.receiveShadow = true
  const c = new THREE.Mesh(canopy, species === 'olive' ? mats.olive : mats.canopy)
  c.castShadow = c.receiveShadow = true
  g.add(b, c)
  return g
}

/**
 * Many distant trees merged into two meshes (canopy + branches): one draw call each,
 * however large the forest.
 */
export function buildForest(points: { x: number; z: number; s: number; species: Species }[], mats: ReturnType<typeof createFoliageMaterials>, rand: Rand, detail: number) {
  const byKind: Record<Species, { canopy: THREE.BufferGeometry[]; branches: THREE.BufferGeometry[] }> = {
    olive: { canopy: [], branches: [] },
    canopy: { canopy: [], branches: [] },
  }
  for (const p of points) {
    const { branches, canopy } = treeGeometry(p.species, p.s, rand, detail)
    const rot = rand() * Math.PI * 2
    for (const geo of [branches, canopy]) {
      geo.rotateY(rot)
      geo.translate(p.x, 0, p.z)
    }
    byKind[p.species].canopy.push(canopy)
    byKind[p.species].branches.push(branches)
  }
  const group = new THREE.Group()
  for (const species of ['olive', 'canopy'] as Species[]) {
    const k = byKind[species]
    if (!k.canopy.length) continue
    const canopy = new THREE.Mesh(mergeGeometries(k.canopy), species === 'olive' ? mats.olive : mats.canopy)
    const branches = new THREE.Mesh(mergeGeometries(k.branches), species === 'olive' ? mats.barkOlive : mats.bark)
    canopy.receiveShadow = true
    group.add(canopy, branches)
  }
  return group
}
