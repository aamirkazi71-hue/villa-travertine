import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { Post, renderStillTarget } from './post'
import { createTextures, type TextureSet } from './textures'
import { createMaterials, type MaterialSet } from './materials'
import { buildVilla, type Layer, type Part, type Anchor } from './villa'
import { buildLandscape, buildSky } from './landscape'
import { buildStudio } from './studio'
import { curves, sample, type CameraPose, type TrackName } from './tracks'
import { notes } from './notes'
import { AFTERNOON, DUSK, lightingAt } from './lighting'

/** Vertical lift per construction layer at full separation (metres). */
const LIFT: Record<Layer, number> = {
  foundation: 0,
  gfFloor: 1.3,
  gfStructure: 2.8,
  gfSkin: 2.8,
  gfGlazing: 2.8,
  ffSlab: 5.8,
  ffFloor: 7.0,
  ffStructure: 8.6,
  ffSkin: 8.6,
  ffGlazing: 8.6,
  roof: 11.6,
  interior: 0,
  site: 0,
  landscape: 0,
  trees: 0,
  setout: 0,
}
/** Overall exposure for the AgX tone curve. */
const EXPOSURE = 1.25

const SKIN_OUT: Partial<Record<Layer, number>> = { gfSkin: 1.8, ffSkin: 1.8, gfGlazing: 1.0, ffGlazing: 1.0 }

export type SceneState = { explode: number; skins: number; door: number; dusk: number }

export type PlainPose = { pos: [number, number, number]; look: [number, number, number]; fov: number; exp: number }

export type StillSpec =
  | {
      kind: 'villa'
      pose: CameraPose | PlainPose
      state?: Partial<SceneState>
      layers?: Layer[]
      clay?: boolean | 'concrete'
      ground?: 'lawn' | 'clay' | 'soil'
      width: number
      height: number
    }
  | { kind: 'massing'; variant: 'courtyard' | 'hillside' | 'pavilion' | 'terrace'; width: number; height: number }
  | { kind: 'material'; key: string; width: number; height: number }

export type EngineOptions = { mobile: boolean }

export class VillaEngine {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.05, 700)
  private tex: TextureSet
  private mat: MaterialSet
  private sun = new THREE.DirectionalLight('#ffffff', 3)
  private hemi = new THREE.HemisphereLight('#ffffff', '#888888', 1)
  private sky: ReturnType<typeof buildSky>
  private parts: Part[]
  private anchors: Record<string, Anchor>
  private lights: { light: THREE.Light; day: number; dusk: number }[]
  private post: Post | null = null
  private flames: THREE.Mesh[] = []
  private curtains: { mesh: THREE.Mesh; width: number; height: number }[] = []
  private swaying: { g: THREE.Group; phase: number; amp: number }[] = []
  private fireLight: THREE.Light
  private envScene = new THREE.Scene()
  private envCache = new Map<number, THREE.Texture>()
  private baseEnv = 1
  private baseHemi = 1
  private doorPivot: THREE.Object3D
  private ground: THREE.Mesh
  private studio: ReturnType<typeof buildStudio>
  private pmrem: THREE.PMREMGenerator
  private envTex: THREE.Texture

  private active: TrackName = 'walk'
  private target: Record<TrackName, number> = { walk: 0, assembly: 0 }
  private current: Record<TrackName, number> = { walk: 0, assembly: 0 }
  private pose: CameraPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, exp: 1 }
  private running = false
  private dirty = true
  private raf = 0
  private last = 0
  private width = 1
  private height = 1
  private noteEls = new Map<string, HTMLElement>()
  private ro: ResizeObserver
  private stillQueue: { spec: StillSpec; resolve: (url: string) => void; reject: (e: unknown) => void }[] = []
  private stillBusy = false
  private urls: string[] = []
  private disposed = false
  private firstFrame: (() => void) | null = null
  readonly mobile: boolean

  constructor(readonly canvas: HTMLCanvasElement, opts: EngineOptions) {
    this.mobile = opts.mobile
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    const r = this.renderer
    // Post-processing (AO at full resolution) is the main cost on desktop, so cap the pixel ratio there.
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    r.outputColorSpace = THREE.SRGBColorSpace
    // AgX rolls highlights off like film and keeps sunlit stone from clipping to flat white.
    r.toneMapping = THREE.AgXToneMapping
    r.toneMappingExposure = 1
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFSoftShadowMap

    this.tex = createTextures()
    this.mat = createMaterials(this.tex)
    const maxAniso = r.capabilities.getMaxAnisotropy()
    for (const v of Object.values(this.tex)) if (v instanceof THREE.Texture) v.anisotropy = Math.min(8, maxAniso)

    this.pmrem = new THREE.PMREMGenerator(r)
    this.envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    RectAreaLightUniformsLib.init()

    this.sky = buildSky()
    this.scene.add(this.sky.sky)
    // Reflections and ambient light come from the same sky the visitor sees, rebaked as the light changes.
    const envSky = new THREE.Mesh(this.sky.sky.geometry, this.sky.material)
    envSky.frustumCulled = false
    this.envScene.add(envSky)
    this.scene.fog = new THREE.FogExp2('#e6e2d8', 0.0036)

    const villa = buildVilla(this.mat)
    const land = buildLandscape(this.mat)
    this.scene.add(villa.root, land.root)
    this.parts = [...villa.parts, ...land.parts]
    this.anchors = villa.anchors
    this.lights = villa.lights
    this.doorPivot = villa.doorPivot
    this.flames = villa.flames
    this.curtains = villa.curtains
    this.fireLight = villa.fireLight
    this.swaying = land.swaying
    this.ground = land.ground
    for (const p of villa.plants) {
      const g = land.plant(p.x, p.y, p.z, p.s)
      this.scene.add(g)
      this.parts.push({ mesh: g, layer: 'interior', base: g.position.clone(), out: new THREE.Vector3() })
    }

    const s = this.sun
    s.castShadow = true
    const size = opts.mobile ? 2048 : 4096
    s.shadow.mapSize.set(size, size)
    s.shadow.bias = -0.00025
    s.shadow.normalBias = 0.025
    const sc = s.shadow.camera
    sc.left = -24
    sc.right = 24
    sc.top = 24
    sc.bottom = -24
    sc.near = 5
    sc.far = 140
    s.target.position.set(-1, 2, -1)
    this.scene.add(s, s.target, this.hemi)

    this.studio = buildStudio(this.mat)
    this.studio.scene.environment = this.envTex
    this.studio.scene.environmentIntensity = 0.6

    // Desktop gets ambient occlusion, bloom and grading; phones render directly to stay smooth.
    if (!opts.mobile) this.post = new Post(r, this.scene, this.camera, 1, 1)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.resize()
    this.applyState({ explode: 0, skins: 0, door: 0, dusk: 0 })
    this.updateCamera(0)
  }

  /* -------------------------------------------------------------- public */

  onFirstFrame(cb: () => void) {
    this.firstFrame = cb
  }

  setProgress(track: TrackName, p: number, immediate = false) {
    this.target[track] = p
    if (immediate) this.current[track] = p
    this.dirty = true
  }

  setActive(track: TrackName) {
    if (this.active !== track) {
      this.active = track
      this.current[track] = this.target[track]
      this.dirty = true
    }
  }

  private visibleTracks = new Set<TrackName>()
  private hideNote(el: HTMLElement) {
    if (el.style.opacity !== '0') el.style.opacity = '0'
    el.dataset.on = '0'
    if (el instanceof HTMLButtonElement) el.tabIndex = -1
  }

  /** Sequences report visibility; the render loop only runs while one is on screen. */
  setTrackVisible(track: TrackName, on: boolean) {
    if (!on) for (const n of notes) if (n.track === track) { const el = this.noteEls.get(n.key); if (el) this.hideNote(el) }
    if (on) {
      this.visibleTracks.add(track)
      this.setActive(track)
    } else this.visibleTracks.delete(track)
    this.setRunning(this.visibleTracks.size > 0)
  }

  setRunning(on: boolean) {
    if (on === this.running || this.disposed) return
    this.running = on
    if (on) {
      // Draw immediately; don't wait for the next animation frame (which never comes in a hidden tab).
      this.dirty = true
      this.renderNow()
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.tick)
    } else cancelAnimationFrame(this.raf)
  }

  registerNote(key: string, el: HTMLElement | null) {
    if (el) this.noteEls.set(key, el)
    else this.noteEls.delete(key)
    this.dirty = true
  }

  /** Queue an offscreen still. Resolves to an object URL of a JPEG. */
  renderStill(spec: StillSpec) {
    return new Promise<string>((resolve, reject) => {
      this.stillQueue.push({ spec, resolve, reject })
      this.pumpStills()
    })
  }

  /** Current camera pose at a track position (used for reduced-motion stills). */
  poseAt(track: TrackName, p: number): CameraPose {
    return sample(track, p, { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, exp: 1 })
  }

  stateAt(track: TrackName, p: number): SceneState {
    if (track === 'walk') return { explode: 0, skins: 0, door: curves.door(p), dusk: 0 }
    return { explode: curves.explode(p), skins: curves.skins(p), door: 0, dusk: curves.dusk(p) }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    this.stillQueue.length = 0
    for (const u of this.urls) URL.revokeObjectURL(u)
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
    })
    for (const m of Object.values(this.mat)) (m as THREE.Material).dispose()
    for (const t of Object.values(this.tex)) if (t instanceof THREE.Texture) t.dispose()
    this.envTex.dispose()
    for (const t of this.envCache.values()) t.dispose()
    this.post?.dispose()
    this.pmrem.dispose()
    this.renderer.dispose()
  }

  /* ------------------------------------------------------------ internals */

  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    if (w === this.width && h === this.height) return
    this.width = w
    this.height = h
    this.renderer.setSize(w, h, false)
    this.post?.setSize(w, h, this.renderer.getPixelRatio())
    this.camera.aspect = w / h
    this.dirty = true
    if (!this.running) this.renderNow()
  }

  private lastAmbient = 0
  private tick = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    const t = this.active
    const diff = this.target[t] - this.current[t]
    if (Math.abs(diff) > 0.00002) {
      // Critically damped follow: smooth, but never drifts far from the scrollbar.
      this.current[t] += diff * (1 - Math.exp(-dt * (this.mobile ? 7 : 5.5)))
      this.dirty = true
    } else if (diff !== 0) {
      this.current[t] = this.target[t]
      this.dirty = true
    }
    // While the camera rests, keep the scene alive at a gentle 30 fps (wind, water, fire, clouds).
    if (!this.dirty && this.ambient && now - this.lastAmbient > 33) this.dirty = true
    if (this.dirty) {
      this.lastAmbient = now
      this.renderNow()
    }
  }

  private renderNow() {
    const t = this.active
    const p = this.current[t]
    this.applyState(this.stateAt(t, p))
    if (this.ambient) this.animate(performance.now() / 1000)
    this.updateCamera(p)
    if (this.post) this.post.render()
    else this.renderer.render(this.scene, this.camera)
    this.updateNotes(p)
    this.dirty = this.blend !== null
    if (this.firstFrame) {
      const cb = this.firstFrame
      this.firstFrame = null
      cb()
    }
  }

  /* ------------------------------------------------------------ focus */

  private focusPose: CameraPose | null = null
  private blend: { from: CameraPose; start: number; dur: number } | null = null
  private shown: CameraPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, exp: 1 }
  private mixed: CameraPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, exp: 1 }

  /** Fly to a close-up of a hotspot (or back to the tour with null). */
  focusOn(key: string | null) {
    const n = key ? notes.find((x) => x.key === key) : null
    const clone = (p: CameraPose): CameraPose => ({ pos: p.pos.clone(), look: p.look.clone(), fov: p.fov, exp: p.exp })
    this.blend = { from: clone(this.shown), start: performance.now(), dur: n ? 1300 : 1000 }
    this.focusPose = n?.focus
      ? { pos: new THREE.Vector3(...n.focus.pos), look: new THREE.Vector3(...n.focus.look), fov: n.focus.fov, exp: this.shown.exp }
      : null
    this.dirty = true
  }

  get focused() {
    return this.focusPose !== null
  }

  private updateCamera(p: number) {
    const portrait = this.width / this.height < 0.9
    sample(this.active, p, this.pose, portrait)
    let pose = this.focusPose ?? this.pose
    // 0–1: how far the framing has shifted left to clear the detail card.
    let shift = this.focusPose ? 1 : 0
    if (this.blend) {
      const k = Math.min(1, (performance.now() - this.blend.start) / this.blend.dur)
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      const to = this.focusPose ?? this.pose
      this.mixed.pos.lerpVectors(this.blend.from.pos, to.pos, e)
      this.mixed.look.lerpVectors(this.blend.from.look, to.look, e)
      this.mixed.fov = this.blend.from.fov + (to.fov - this.blend.from.fov) * e
      this.mixed.exp = this.blend.from.exp + (to.exp - this.blend.from.exp) * e
      pose = this.mixed
      shift = this.focusPose ? e : 1 - e
      if (k >= 1) this.blend = null
    }
    this.shown.pos.copy(pose.pos)
    this.shown.look.copy(pose.look)
    this.shown.fov = pose.fov
    this.shown.exp = pose.exp
    this.applyPose(this.camera, pose, this.camera.aspect, portrait && !this.focusPose, this.mobile ? 0 : shift * 0.14 * this.width)
    this.applyInterior(pose.pos)
    this.renderer.toneMappingExposure = pose.exp * EXPOSURE * this.lightExp
  }

  private applyPose(cam: THREE.PerspectiveCamera, pose: CameraPose, aspect: number, liftForText = false, shiftX = 0) {
    cam.position.copy(pose.pos)
    cam.lookAt(pose.look)
    // Portrait screens: widen the vertical field so the composition's width survives.
    let fov = pose.fov
    if (aspect < 1.2) {
      const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(pose.fov) / 2) * 1.5)
      const vfov = 2 * Math.atan(Math.tan(hfov / 2) / aspect)
      fov = Math.min(THREE.MathUtils.radToDeg(vfov), pose.fov * 1.9, 82)
    }
    cam.fov = fov
    cam.aspect = aspect
    // On phones the chapter text sits at the bottom, so shift the image up to keep the subject clear of it.
    // View offsets render a larger virtual frame and keep part of it; aspect and field of view are set for
    // that full frame so the visible image keeps its proportions.
    if (liftForText) {
      const k = Math.round(this.height * 0.13)
      const fullH = this.height + 2 * k
      cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * (fullH / this.height)))
      cam.aspect = this.width / fullH
      cam.setViewOffset(this.width, fullH, 0, 2 * k, this.width, this.height)
    } else if (shiftX > 0.5) {
      // Render a wider frame and keep its right part, so the subject moves left of centre.
      cam.aspect = (this.width + 2 * shiftX) / this.height
      cam.setViewOffset(this.width + 2 * shiftX, this.height, 2 * shiftX, 0, this.width, this.height)
    } else if (cam.view) cam.clearViewOffset()
    cam.updateProjectionMatrix()
    this.sky.sky.position.copy(cam.position)
  }

  /**
   * Indoors, the sky can only reach surfaces through the glazing, so image-based light and the
   * hemisphere fill are reduced as the camera enters the house. The window area lights take over.
   */
  private applyInterior(pos: THREE.Vector3) {
    const dx = Math.max(0, Math.abs(pos.x + 0.5) - 11.3)
    const dz = Math.max(0, Math.abs(pos.z) - 6.3)
    const dy = Math.max(0, pos.y - 7.4)
    const inside = Math.max(0, 1 - Math.max(dx, dz, dy) / 2)
    this.scene.environmentIntensity = this.baseEnv * THREE.MathUtils.lerp(1, 0.3, inside)
    this.hemi.intensity = this.baseHemi * THREE.MathUtils.lerp(1, 0.4, inside)
  }

  private bakeEnv(hour: number) {
    const q = Math.round(hour * 4) / 4
    let t = this.envCache.get(q)
    if (!t) {
      this.sky.uniforms.sunDisc.value = 0
      t = this.pmrem.fromScene(this.envScene, 0, 0.1, 1000).texture
      this.sky.uniforms.sunDisc.value = 1
      this.envCache.set(q, t)
    }
    this.scene.environment = t
  }

  private applyState(st: SceneState, layers?: Layer[], useOverride = true) {
    const { explode, skins, door, dusk } = st
    const showInterior = explode < 0.01
    for (const part of this.parts) {
      const lift = LIFT[part.layer] * explode
      const out = (SKIN_OUT[part.layer] ?? 0) * skins
      part.mesh.position.set(part.base.x + part.out.x * out, part.base.y + lift, part.base.z + part.out.z * out)
      if (part.layer === 'trees') {
        // Landscape recedes while the house is taken apart, rather than popping out.
        const s = Math.max(0, 1 - explode * 3)
        part.mesh.scale.setScalar(Math.max(s, 0.001))
        part.mesh.visible = layers ? layers.includes('trees') : s > 0.01
        continue
      }
      if (layers) part.mesh.visible = layers.includes(part.layer)
      else part.mesh.visible = part.layer === 'setout' ? false : part.layer === 'interior' ? showInterior : true
    }
    this.doorPivot.rotation.y = door * 1.42
    const autoHour = AFTERNOON + (DUSK - AFTERNOON) * dusk
    this.applyHour(useOverride && this.hourOverride !== null ? this.hourOverride : autoHour)
  }

  /* ------------------------------------------------------- time of day */

  private hourOverride: number | null = null
  private hourCb: ((hour: number, auto: boolean) => void) | null = null
  private lastHour = -1
  private lightExp = 1
  private fireBase = 1

  /** Set the time of day by hand (null returns control to the scroll-driven light). */
  setHour(hour: number | null) {
    this.hourOverride = hour
    this.dirty = true
    if (!this.running) this.renderNow()
  }

  onHourChange(cb: ((hour: number, auto: boolean) => void) | null) {
    this.hourCb = cb
    if (cb && this.lastHour >= 0) cb(this.lastHour, this.hourOverride === null)
  }

  private applyHour(hour: number) {
    const L = lightingAt(hour)
    this.sun.position.copy(this.sun.target.position).addScaledVector(L.sun, 70)
    this.sun.color.copy(L.sunColor)
    this.sun.intensity = L.sunI
    this.hemi.color.copy(L.hemiSky)
    this.hemi.groundColor.copy(L.hemiGround)
    this.baseHemi = L.hemiI
    this.hemi.intensity = L.hemiI
    const u = this.sky.uniforms
    u.top.value.copy(L.top)
    u.horizon.value.copy(L.horizon)
    u.ground.value.copy(L.ground)
    u.sunColor.value.copy(L.sunColor).multiplyScalar(0.9)
    u.sunDir.value.copy(L.sun)
    u.cloudColor.value.copy(L.cloud)
    u.cloudShade.value.copy(L.cloudShade)
    u.stars.value = L.stars
    ;(this.scene.fog as THREE.FogExp2).color.copy(L.horizon).lerp(L.top, 0.15)
    this.baseEnv = L.env
    this.scene.environmentIntensity = L.env
    this.bakeEnv(hour)
    for (const l of this.lights) l.light.intensity = THREE.MathUtils.lerp(l.day, l.dusk, L.night)
    this.fireBase = this.fireLight.intensity
    ;(this.mat.lamp as THREE.MeshStandardMaterial).emissiveIntensity = L.lamp
    ;(this.mat.flame as THREE.MeshStandardMaterial).emissiveIntensity = L.flame
    ;(this.mat.shade as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.25 + L.night * 1.6
    this.lightExp = L.exp
    if (Math.abs(hour - this.lastHour) > 0.02) {
      this.lastHour = hour
      this.hourCb?.(hour, this.hourOverride === null)
    }
  }

  /* --------------------------------------------------- ambient motion */

  /** Ambient motion runs only where motion is welcome; the reduced-motion view never starts it. */
  ambient = true

  private animate(t: number) {
    this.sky.uniforms.time.value = t
    this.tex.waterNormal.offset.set(t * 0.012, t * 0.007)
    // Fire: flame tongues swap every few frames and the firelight flickers with them.
    const flick = 0.82 + 0.1 * Math.sin(t * 11.3) + 0.08 * Math.sin(t * 23.7 + 1.3)
    this.flames.forEach((f, i) => {
      f.scale.y = 0.88 + 0.12 * Math.sin(t * 9.1 + i * 2.1) + 0.05 * Math.sin(t * 21 + i)
      const map = (f.material as THREE.MeshBasicMaterial).map
      if (map) map.offset.x = (Math.floor(t * 10) * 0.173) % 1
    })
    this.fireLight.intensity = this.fireBase * flick
    // Sheer curtains breathing in a light draught.
    for (const c of this.curtains) {
      const p = c.mesh.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i)
        const bottom = p.getY(i) < 0 ? 1 : 0
        const u = (x / c.width) * Math.PI * 2 * 7
        const sway = Math.sin(t * 0.7 + x * 1.3) * 0.025 * (0.4 + bottom)
        p.setZ(i, Math.sin(u) * 0.05 + Math.sin(u * 2.3) * 0.012 + sway)
      }
      p.needsUpdate = true
      c.mesh.geometry.computeVertexNormals()
    }
    // Trees lean very slightly in the wind, each on its own phase.
    for (const s of this.swaying) {
      s.g.rotation.z = Math.sin(t * 0.55 + s.phase) * s.amp
      s.g.rotation.x = Math.sin(t * 0.41 + s.phase * 1.7) * s.amp * 0.6
    }
  }

  private v = new THREE.Vector3()
  private updateNotes(p: number) {
    if (!this.noteEls.size) return
    const st = this.stateAt(this.active, p)
    const hideAll = this.focusPose !== null || this.blend !== null
    for (const n of notes) {
      const el = this.noteEls.get(n.key)
      if (!el) continue
      let a = 0
      if (n.track === this.active) {
        const f = 0.012
        a = Math.min(1, Math.max(0, (p - n.from) / f)) * Math.min(1, Math.max(0, (n.to - p) / f))
      }
      const anc = this.anchors[n.anchor]
      if (a <= 0 || !anc || hideAll) {
        this.hideNote(el)
        continue
      }
      const lift = LIFT[anc.layer] * st.explode
      const out = (SKIN_OUT[anc.layer] ?? 0) * st.skins
      this.v.copy(anc.pos)
      this.v.y += lift
      if (anc.layer === 'gfSkin' || anc.layer === 'ffSkin') this.v.z += out
      this.v.project(this.camera)
      const visible = this.v.z < 1 && Math.abs(this.v.x) < 0.94 && Math.abs(this.v.y) < 0.9
      const x = (this.v.x * 0.5 + 0.5) * this.width
      const y = (-this.v.y * 0.5 + 0.5) * this.height
      el.style.opacity = visible ? String(a) : '0'
      // Only fully shown hotspots are clickable or reachable by keyboard.
      const on = visible && a > 0.6
      el.dataset.on = on ? '1' : '0'
      if (el instanceof HTMLButtonElement) el.tabIndex = on ? 0 : -1
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }
  }

  /* --------------------------------------------------------------- stills */

  private pumpStills() {
    if (this.stillBusy || this.disposed) return
    const job = this.stillQueue.shift()
    if (!job) return
    this.stillBusy = true
    // Yield between stills so scrolling stays responsive.
    const run = () => {
      if (this.disposed) return
      try {
        this.captureStill(job.spec).then(job.resolve, job.reject)
      } catch (e) {
        job.reject(e)
      } finally {
        this.stillBusy = false
        setTimeout(() => this.pumpStills(), 40)
      }
    }
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 600 })
    else setTimeout(run, 30)
  }

  private captureStill(spec: StillSpec): Promise<string> {
    const r = this.renderer
    const w = spec.width
    const h = spec.height
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.05, 1200)
    const prevExposure = r.toneMappingExposure
    const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = []

    let scene: THREE.Scene = this.scene
    let cleanup = () => {}
    if (spec.kind === 'villa') {
      const st = { explode: 0, skins: 0, door: 0, dusk: 0, ...spec.state }
      this.applyState(st, spec.layers, false)
      if (spec.clay) {
        for (const part of this.parts) {
          part.mesh.traverse((o) => {
            const mesh = o as THREE.Mesh
            if (!mesh.isMesh || part.layer === 'site' || part.layer === 'landscape') return
            swapped.push([mesh, mesh.material])
            const isGlass = Array.isArray(mesh.material) ? false : mesh.material === this.mat.glass
            const base = spec.clay === 'concrete' ? this.mat.concrete : this.mat.clay
            mesh.material = isGlass ? this.mat.glass : part.layer === 'foundation' ? (spec.clay === 'concrete' ? this.mat.concrete : this.mat.clayDark) : base
          })
        }
      }
      const gm = spec.ground === 'clay' ? this.mat.clay : spec.ground === 'soil' ? this.mat.soil : this.mat.lawn
      swapped.push([this.ground, this.ground.material])
      this.ground.material = gm
      this.ground.visible = true
      const sp = spec.pose
      const pose: CameraPose = Array.isArray(sp.pos)
        ? { pos: new THREE.Vector3(...(sp as PlainPose).pos), look: new THREE.Vector3(...(sp as PlainPose).look), fov: sp.fov, exp: sp.exp }
        : (sp as CameraPose)
      this.applyPose(cam, pose, w / h)
      this.applyInterior(pose.pos)
      r.toneMappingExposure = pose.exp * EXPOSURE * this.lightExp
    } else if (spec.kind === 'massing') {
      const g = this.studio.massing(spec.variant)
      this.studio.show(g, new THREE.Vector3(-0.55, 0.75, 0.45).normalize(), '#ddd6ca')
      scene = this.studio.scene
      cam.position.set(30, 24, 32)
      cam.lookAt(0, 1.5, 0)
      cam.fov = 30
      cam.updateProjectionMatrix()
      r.toneMappingExposure = EXPOSURE
      cleanup = () => g.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    } else {
      const g = this.studio.sample(spec.key)
      const glass = spec.key === 'glass'
      const framed = glass || spec.key === 'bronze'
      this.studio.show(g, new THREE.Vector3(-1, framed ? 0.9 : 0.32, framed ? 0.8 : 0.25).normalize(), '#d9d2c6')
      scene = this.studio.scene
      if (spec.key === 'bronze') {
        cam.position.set(0.55, 0.55, 0.9)
        cam.lookAt(0, 0.3, 0)
      } else if (glass) {
        cam.position.set(1.4, 1.1, 2.4)
        cam.lookAt(0, 0.6, 0)
      } else {
        cam.position.set(0, 2.6, 0.9)
        cam.lookAt(0, 0, 0)
      }
      cam.fov = glass ? 42 : 30
      cam.updateProjectionMatrix()
      r.toneMappingExposure = EXPOSURE
      cleanup = () => g.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    }

    const prevBg = scene.background
    const ldr = renderStillTarget(r, scene, cam, w, h)
    const buf = new Uint8Array(w * h * 4)
    r.readRenderTargetPixels(ldr, 0, 0, w, h, buf)
    ldr.dispose()
    scene.background = prevBg

    for (const [mesh, m] of swapped) mesh.material = m
    cleanup()
    r.toneMappingExposure = prevExposure
    this.dirty = true

    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(w, h)
    const row = w * 4
    for (let y = 0; y < h; y++) img.data.set(buf.subarray((h - 1 - y) * row, (h - y) * row), y * row)
    ctx.putImageData(img, 0, 0)
    return new Promise((resolve, reject) =>
      c.toBlob(
        (b) => {
          if (!b) return reject(new Error('Still capture failed'))
          const url = URL.createObjectURL(b)
          this.urls.push(url)
          resolve(url)
        },
        'image/jpeg',
        0.88,
      ),
    )
  }
}
