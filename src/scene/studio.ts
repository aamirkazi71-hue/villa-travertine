import * as THREE from 'three'
import type { MaterialSet } from './materials'
import { worldUV } from './villa'
import type { Project } from '../content/site'

/**
 * A neutral studio scene, used for two kinds of still:
 * — massing models for the demonstration portfolio entries
 * — material samples under raking light for the materials study
 */
export function buildStudio(m: MaterialSet) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#d9d2c6')
  const hemi = new THREE.HemisphereLight('#f4efe6', '#8d8478', 0.9)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff1dc', 3.2)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  const sc = sun.shadow.camera
  sc.left = sc.bottom = -26
  sc.right = sc.top = 26
  sc.near = 1
  sc.far = 120
  scene.add(sun, sun.target)

  const content = new THREE.Group()
  scene.add(content)

  function box(g: THREE.Group, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
    const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] as const
    worldUV(geo, ...c)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...c)
    mesh.castShadow = mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }

  const darkGlass = new THREE.MeshStandardMaterial({ color: '#4d5352', roughness: 0.15, metalness: 0.2 })

  function canopy(g: THREE.Group, x: number, z: number, s: number) {
    const geo = new THREE.IcosahedronGeometry(1, 2)
    const t = new THREE.Mesh(geo, m.clayDark)
    t.position.set(x, 2.4 * s + 1.2 * s, z)
    t.scale.set(1.6 * s, 1.3 * s, 1.6 * s)
    t.castShadow = true
    g.add(t)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 2.6 * s), m.clayDark)
    trunk.position.set(x, 1.3 * s, z)
    trunk.castShadow = true
    g.add(trunk)
  }

  /** Massing models: deliberately abstract, so they cannot be mistaken for real projects. */
  function massing(variant: Project['variant']) {
    const g = new THREE.Group()
    box(g, -24, -0.2, -24, 24, 0, 24, m.clay)
    if (variant === 'courtyard') {
      box(g, -9, 0, -7, 9, 3.4, -3, m.clay)
      box(g, -9, 0, -3, -5, 3.4, 7, m.clay)
      box(g, 5, 0, -3, 9, 3.4, 7, m.clay)
      box(g, -9.4, 3.4, -7.4, 9.4, 3.6, -2.6, m.clay)
      box(g, -9.4, 3.4, -2.6, -4.6, 3.6, 7.4, m.clay)
      box(g, 4.6, 3.4, -2.6, 9.4, 3.6, 7.4, m.clay)
      box(g, -5, 0.4, -3, 5, 0.42, -2.98, darkGlass)
      box(g, -5, 0.1, -3, 5, 3.0, -2.96, darkGlass)
      box(g, -5, 0, 4.5, 5, 1.2, 4.9, m.clay)
      canopy(g, 0, 1.5, 1)
    } else if (variant === 'hillside') {
      for (let i = 0; i < 4; i++) box(g, -20, 0, -20 + i * 6, 20, 6 - i * 1.6, -14 + i * 6, m.clayDark)
      box(g, -8, 6, -16, 8, 9.2, -10, m.clay)
      box(g, -12, 3.2, -10.5, 4, 6.4, -4, m.clay)
      box(g, -4, 0, -5, 11, 3.2, 2, m.clay)
      box(g, -8.3, 9.2, -16.3, 8.3, 9.4, -9.4, m.clay)
      box(g, -4, 0.1, 2, 11, 2.9, 2.04, darkGlass)
      box(g, -12, 3.4, -4, 4, 6.1, -3.96, darkGlass)
      canopy(g, 13, 6, 1.1)
    } else if (variant === 'pavilion') {
      box(g, -9, 0, -3.5, 9, 0.4, 3.5, m.clay)
      box(g, -10, 3.3, -4.5, 10, 3.55, 4.5, m.clay)
      for (const x of [-8.6, -4.3, 0, 4.3, 8.6]) for (const z of [-3, 3]) box(g, x - 0.08, 0.4, z - 0.08, x + 0.08, 3.3, z + 0.08, m.clayDark)
      box(g, -7, 0.4, -2.2, 7, 3.3, 2.2, darkGlass)
      box(g, 2, 0.4, -2.2, 5, 3.3, 2.2, m.clay)
      canopy(g, -12, 6, 1.2)
      canopy(g, 13, -6, 1)
    } else {
      for (let i = 0; i < 4; i++) {
        const x = -12 + i * 6.2
        const zf = i % 2 ? 4.6 : 4
        box(g, x, 0, -6, x + 6, 7, zf, m.clay)
        box(g, x + 0.6, 0.3, zf, x + 5.4, 2.9, zf + 0.04, darkGlass)
        box(g, x + 1.2, 3.8, zf, x + 4.8, 6.0, zf + 0.04, darkGlass)
        box(g, x - 0.1, 7, -6.2, x + 6.1, 7.25, zf + 0.25, m.clay)
      }
    }
    return g
  }

  /** A sample slab, or for glass, a framed corner in front of a stone ground. */
  function sample(key: string) {
    const g = new THREE.Group()
    const mat =
      key === 'travertine' ? m.travertine
      : key === 'limestone' ? m.limestone
      : key === 'oak' ? m.oakCladding
      : key === 'walnut' ? m.walnut
      : key === 'bronze' ? m.bronze
      : m.limestone
    if (key === 'glass') {
      box(g, -2, -0.1, -2, 2, 0, 2, m.travertine)
      box(g, -2, 0, -0.05, 2, 1.6, -0.03, m.glass).renderOrder = 2
      box(g, -2, 0, -0.08, 2, 0.05, 0, m.bronze)
      box(g, 0.25, 0, -0.08, 0.3, 1.6, 0, m.bronze)
      box(g, -2, 1.55, -0.08, 2, 1.6, 0, m.bronze)
      box(g, -2, 0, -2, 2, 1.6, -1.9, m.oakCladding)
    } else if (key === 'bronze') {
      // A window-frame corner: bronze sill and mullion against limestone.
      box(g, -2, -0.1, -2, 2, 0, 2, m.limestone)
      box(g, -1.2, 0, -0.1, 1.2, 0.07, 0.06, m.bronze)
      box(g, -0.06, 0.07, -0.1, 0.06, 1.4, 0.06, m.bronze)
      box(g, -1.2, 0.07, -0.02, 1.2, 1.4, 0.0, m.glass).renderOrder = 2
    } else {
      box(g, -1.2, -0.06, -1.2, 1.2, 0, 1.2, mat)
    }
    return g
  }

  function show(obj: THREE.Object3D, sunDir: THREE.Vector3, bg = '#d9d2c6') {
    content.clear()
    content.add(obj)
    sun.position.copy(sunDir).multiplyScalar(60)
    sun.target.position.set(0, 0, 0)
    ;(scene.background as THREE.Color).set(bg)
  }

  return { scene, sun, hemi, massing, sample, show }
}
