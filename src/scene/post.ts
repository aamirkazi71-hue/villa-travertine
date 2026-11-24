import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

/**
 * Ambient occlusion that ignores the sky dome, glass and alpha-tested leaf cards
 * (their quads would otherwise cast square "contact shadows").
 */
class ArchitecturalAO extends GTAOPass {
  overrideVisibility() {
    super.overrideVisibility()
    this.scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (o.userData.noAO) o.visible = false
      else if (mat && !Array.isArray(mat) && (mat.transparent || mat.alphaTest > 0)) o.visible = false
    })
  }
}

/** Final look: a gentle lens vignette and fine grain, which also dithers away gradient banding. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 0.32 },
    grain: { value: 0.016 },
    contrast: { value: 1.1 },
    saturation: { value: 1.14 },
    resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float vignette; uniform float grain; uniform vec2 resolution; uniform float contrast; uniform float saturation;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      // AgX is deliberately flat; restore a little photographic contrast and colour.
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(l), c.rgb, saturation);
      c.rgb = clamp((c.rgb - 0.5) * contrast + 0.5, 0.0, 1.0);
      vec2 d = vUv - 0.5;
      d.x *= resolution.x / resolution.y;
      c.rgb *= 1.0 - dot(d, d) * vignette;
      float n = fract(sin(dot(vUv * resolution, vec2(12.9898, 78.233))) * 43758.5453);
      c.rgb += (n - 0.5) * grain;
      gl_FragColor = c;
    }`,
}

function makeAO(scene: THREE.Scene, camera: THREE.PerspectiveCamera, w: number, h: number) {
  const ao = new ArchitecturalAO(scene, camera, w, h)
  ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.2, scale: 1.25, samples: 16, distanceFallOff: 1 })
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 })
  ao.blendIntensity = 1
  return ao
}

function makeBloom(w: number, h: number) {
  // Threshold is in linear HDR, before tone mapping: only lamps, flames and sun glints bloom.
  return new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.32, 0.55, 3.2)
}

/** On-screen pipeline: scene → AO → bloom → filmic output → grade. */
export class Post {
  readonly composer: EffectComposer
  private grade: ShaderPass
  private passes: { dispose(): void }[] = []

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, w: number, h: number) {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 })
    this.composer = new EffectComposer(renderer, rt)
    const ao = makeAO(scene, camera, w, h)
    const bloom = makeBloom(w, h)
    const output = new OutputPass()
    this.grade = new ShaderPass(GradeShader)
    this.composer.addPass(new RenderPass(scene, camera))
    this.composer.addPass(ao)
    this.composer.addPass(bloom)
    this.composer.addPass(output)
    this.composer.addPass(this.grade)
    this.passes = [ao, bloom, output, this.grade]
  }

  setSize(w: number, h: number, pixelRatio: number) {
    this.composer.setPixelRatio(pixelRatio)
    this.composer.setSize(w, h)
    ;(this.grade.uniforms.resolution.value as THREE.Vector2).set(w * pixelRatio, h * pixelRatio)
  }

  render() {
    this.composer.render()
  }

  dispose() {
    for (const p of this.passes) p.dispose()
    this.composer.dispose()
  }
}

/**
 * Offscreen still through the same pipeline (without grain), returned as an 8-bit
 * sRGB render target ready for readPixels. The caller disposes it.
 */
export function renderStillTarget(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, w: number, h: number) {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, rt)
  composer.setPixelRatio(1)
  composer.setSize(w, h)
  composer.renderToScreen = false
  const ao = makeAO(scene, camera, w, h)
  const bloom = makeBloom(w, h)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(ao)
  composer.addPass(bloom)
  composer.render()
  const ldr = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType })
  const output = new OutputPass()
  output.render(renderer, ldr, composer.readBuffer, 0, false)
  renderer.setRenderTarget(null)
  output.dispose()
  ao.dispose()
  bloom.dispose()
  composer.dispose()
  rt.dispose()
  return ldr
}
