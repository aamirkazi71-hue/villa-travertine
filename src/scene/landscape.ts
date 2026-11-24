import * as THREE from 'three'
import type { MaterialSet } from './materials'
import { worldUV, type Layer, type Part } from './villa'
import { buildForest, buildTree, createFoliageMaterials } from './trees'


let s = 7
const rnd = () => {
  s = (s * 16807) % 2147483647
  return (s - 1) / 2147483646
}

export function buildLandscape(m: MaterialSet) {
  const root = new THREE.Group()
  root.name = 'landscape'
  const parts: Part[] = []
  const reg = (o: THREE.Object3D, layer: Layer) => {
    root.add(o)
    parts.push({ mesh: o, layer, base: o.position.clone(), out: new THREE.Vector3() })
  }

  function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: THREE.Material, layer: Layer, cast = true) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
    const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] as const
    worldUV(g, ...c)
    const mesh = new THREE.Mesh(g, mat)
    mesh.position.set(...c)
    mesh.castShadow = cast
    mesh.receiveShadow = true
    reg(mesh, layer)
    return mesh
  }

  function plane(x0: number, z0: number, x1: number, z1: number, y: number, mat: THREE.Material, layer: Layer) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0)
    g.rotateX(-Math.PI / 2)
    const uv = g.attributes.uv
    const p = g.attributes.position
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + cx, p.getZ(i) + cz)
    const mesh = new THREE.Mesh(g, mat)
    mesh.position.set(cx, y, cz)
    mesh.receiveShadow = true
    reg(mesh, layer)
    return mesh
  }

  // Ground.
  const ground = plane(-200, -200, 200, 200, 0, m.lawn, 'site')

  // Street side: gravel forecourt and drive.
  plane(-16, 7.2, 14, 19, 0.012, m.gravel, 'landscape')
  plane(-3.6, 19, 1.8, 90, 0.012, m.gravel, 'landscape')
  // Limestone stepping path from the drive to the steps.
  for (let i = 0; i < 6; i++) box(-2.6, 0, 7.4 + i * 1.9, 0.2, 0.05, 8.9 + i * 1.9, m.limestone, 'landscape', false)

  // Garden side: travertine terrace continuous with the interior floor.
  box(-12.6, 0, -10.4, 10.6, 0.4, -6, m.paving, 'landscape', false)
  box(-12.6, 0, -6, -12.16, 0.4, 6.5, m.paving, 'landscape', false)
  // Pool with travertine coping.
  box(-11.4, 0, -16, 1.4, 0.08, -15.6, m.travertine, 'landscape', false)
  box(-11.4, 0, -11.4, 1.4, 0.08, -11.0, m.travertine, 'landscape', false)
  box(-11.4, 0, -15.6, -11.0, 0.08, -11.4, m.travertine, 'landscape', false)
  box(1.0, 0, -15.6, 1.4, 0.08, -11.4, m.travertine, 'landscape', false)
  plane(-11, -15.6, 1, -11.4, 0.04, m.water, 'landscape')
  // Two loungers on the terrace.
  for (const x of [3.2, 5.0]) {
    box(x - 0.35, 0.4, -9.9, x + 0.35, 0.62, -8.0, m.walnut, 'landscape')
    box(x - 0.33, 0.62, -9.85, x + 0.33, 0.72, -8.05, m.linen, 'landscape')
  }

  // Trees: silver-green olives near the house, deeper-green canopy trees further out.
  const foliage = createFoliageMaterials(rnd)
  // Hedges are instanced, so they use the canopy leaves without per-vertex colour.
  const hedgeLeaf = new THREE.MeshStandardMaterial({ map: foliage.canopy.map, alphaTest: 0.45, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.8, color: '#9ea78a' })
  const leafGeo = new THREE.PlaneGeometry(1, 1)

  /** Every near tree, for a slow wind sway pivoting at its base. */
  const swaying: { g: THREE.Group; phase: number; amp: number }[] = []
  function tree(x: number, z: number, scale: number, tall = false) {
    const g = buildTree(tall ? 'canopy' : 'olive', scale, foliage, rnd)
    g.position.set(x, 0, z)
    g.rotation.y = rnd() * Math.PI * 2
    reg(g, 'trees')
    swaying.push({ g, phase: rnd() * 10, amp: tall ? 0.01 : 0.015 })
  }
  tree(-16.5, 9.5, 1.0)
  tree(11.8, 10.2, 0.95)
  tree(-18.5, -1, 1.1, true)
  tree(16, -3.5, 1.0, true)
  tree(-16, -11.5, 1.2)
  tree(6.5, -17, 1.05)
  tree(13.5, -12.5, 1.25, true)
  tree(6, -26, 1.3, true)
  tree(-20, -16.5, 1.15, true)
  tree(10, -22.5, 1.1, true)
  tree(-23, 14, 1.3, true)
  tree(20, 15, 1.2, true)

  // Clipped hedges: a dense core clothed in leaf cards, so the clipped face reads as foliage, not a box.
  function hedge(x0: number, z0: number, x1: number, z1: number, h: number) {
    box(x0 + 0.06, 0, z0 + 0.06, x1 - 0.06, h - 0.05, z1 - 0.06, m.hedge, 'landscape')
    const w = x1 - x0
    const d = z1 - z0
    const count = Math.round((2 * (w + d) * h + w * d) * 70)
    const inst = new THREE.InstancedMesh(leafGeo, hedgeLeaf, count)
    const mtx = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const v = new THREE.Vector3()
    const perim = 2 * (w + d)
    for (let i = 0; i < count; i++) {
      const top = rnd() < (w * d) / (perim * h + w * d)
      if (top) v.set(x0 + rnd() * w, h - 0.02 + rnd() * 0.06, z0 + rnd() * d)
      else {
        let t = rnd() * perim
        const y = rnd() * h
        if (t < w) v.set(x0 + t, y, z0)
        else if ((t -= w) < d) v.set(x1, y, z0 + t)
        else if ((t -= d) < w) v.set(x1 - t, y, z1)
        else v.set(x0, y, z1 - (t - w))
      }
      e.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI)
      q.setFromEuler(e)
      const sc = 0.22 + rnd() * 0.16
      mtx.compose(v, q, new THREE.Vector3(sc, sc, sc))
      inst.setMatrixAt(i, mtx)
    }
    inst.castShadow = inst.receiveShadow = true
    reg(inst, 'landscape')
  }
  hedge(-17, 7, -16, 20, 1.3)
  hedge(14, 7, 15, 20, 1.3)
  hedge(-22, -35, 20, -34, 1.6)

  /** A potted indoor olive: the same tree, at the scale of a room. */
  function plant(x: number, y: number, z: number, s: number) {
    const g = buildTree('olive', 0.42 * s, foliage, rnd)
    g.position.set(x, y + 0.5 * s, z)
    return g
  }

  // Camera positions outside the house that trees must not grow into.
  const keepOut = [[-34, -24], [-10.5, -27.5], [30, 31], [33, 33], [-14, 37], [-26, -30], [27, 29], [-11, 21]]
  // A loose ring of trees beyond the garden, kept clear of the street-side view: one merged mesh.
  {
    const pts: { x: number; z: number; s: number; species: 'olive' | 'canopy' }[] = []
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2
      const r = 36 + rnd() * 40
      const x = Math.sin(a) * r
      const z = Math.cos(a) * r
      if (z > 12 && Math.abs(x) < 30) continue
      if (keepOut.some(([kx, kz]) => Math.hypot(x - kx, z - kz) < 8)) continue
      pts.push({ x, z, s: 1.1 + rnd() * 0.6, species: rnd() > 0.35 ? 'canopy' : 'olive' })
    }
    reg(buildForest(pts, foliage, rnd, 0.45), 'landscape')
  }

  // Far treeline: a continuous belt of real (low-detail) trees on the horizon, softened by fog.
  {
    const pts: { x: number; z: number; s: number; species: 'olive' | 'canopy' }[] = []
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2
      const r = 110 + rnd() * 60
      pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 1.6 + rnd() * 1.4, species: 'canopy' })
    }
    reg(buildForest(pts, foliage, rnd, 0.18), 'landscape')
  }

  return { root, parts, ground, plant, swaying }
}

/** Gradient sky dome with a sun disc and procedural clouds; colours driven by time of day. */
export function buildSky() {
  const uniforms = {
    top: { value: new THREE.Color('#7f9fbe') },
    horizon: { value: new THREE.Color('#e9e2d4') },
    ground: { value: new THREE.Color('#9a9580') },
    sunColor: { value: new THREE.Color('#fff1d6') },
    sunDir: { value: new THREE.Vector3(0, 1, 0) },
    cloudColor: { value: new THREE.Color('#ffffff') },
    cloudShade: { value: new THREE.Color('#9aa3ad') },
    /** 0 hides the sun disc (used when baking the sky into reflections, where the directional light already provides it). */
    sunDisc: { value: 1 },
    /** Seconds, for slow cloud drift. */
    time: { value: 0 },
    /** 0–1 visibility of the night star field. */
    stars: { value: 0 },
  }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 top; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunColor; uniform vec3 sunDir;
      uniform vec3 cloudColor; uniform vec3 cloudShade; uniform float sunDisc; uniform float time; uniform float stars;
      varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return v;
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizon, top, smoothstep(-0.02, 0.34, h));
        vec3 sd = normalize(sunDir);
        float s = max(dot(d, sd), 0.0);
        col += sunColor * pow(s, 12.0) * 0.28;
        // Fair-weather cumulus projected onto a flat cloud layer, thinning toward the horizon.
        if (h > 0.0) {
          vec2 uv = d.xz / (h + 0.12) * 1.6 + vec2(time * 0.006, time * 0.0025);
          float n = fbm(uv + vec2(3.1, 1.3));
          float c = smoothstep(0.52, 0.78, n) * smoothstep(0.0, 0.18, h);
          float lit = clamp(0.55 + 0.45 * dot(normalize(vec3(d.x, 0.3, d.z)), sd), 0.0, 1.0);
          vec3 cc = mix(cloudShade, cloudColor, lit) + sunColor * pow(s, 6.0) * 0.4;
          col = mix(col, cc, c * 0.85);
        }
        col += sunColor * pow(s, 900.0) * 6.0 * sunDisc;
        if (stars > 0.0 && h > 0.02) {
          vec2 g = floor(vec2(atan(d.z, d.x), asin(h)) * 260.0);
          float r = hash(g);
          float tw = 0.75 + 0.25 * sin(time * 1.7 + r * 40.0);
          col += vec3(0.9, 0.93, 1.0) * step(0.9975, r) * (r - 0.9975) * 900.0 * tw * stars * smoothstep(0.02, 0.25, h);
        }
        col = mix(col, ground, smoothstep(0.0, -0.06, h));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat)
  sky.frustumCulled = false
  sky.renderOrder = -1
  sky.userData.noAO = true
  return { sky, uniforms, material: mat }
}
