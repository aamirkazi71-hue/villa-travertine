import * as THREE from 'three'
import type { TextureSet } from './textures'

export type MaterialSet = ReturnType<typeof createMaterials>

/**
 * Physically based material library. Every finish carries a normal map (surface
 * relief) and, where the real material varies, a roughness map, so highlights break
 * up the way they do on stone, timber and fabric.
 */
export function createMaterials(t: TextureSet) {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)
  const phys = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p)
  const n = (s: number) => new THREE.Vector2(s, s)

  const m = {
    limestone: std({ map: t.limestone, normalMap: t.limestoneNormal, normalScale: n(0.9), roughnessMap: t.limestoneRough, roughness: 1 }),
    /** Unjointed travertine: worktops, the island, the bath surround. */
    travertine: phys({ map: t.travertine, normalMap: t.travertineNormal, normalScale: n(0.6), roughnessMap: t.travertineRough, roughness: 1, clearcoat: 0.08, clearcoatRoughness: 0.4 }),
    /** Jointed travertine slabs: floors, terrace, bathroom walls. */
    paving: phys({ map: t.paving, normalMap: t.pavingNormal, normalScale: n(0.7), roughnessMap: t.pavingRough, roughness: 1, clearcoat: 0.06, clearcoatRoughness: 0.45 }),
    oakCladding: std({ map: t.oakCladding, normalMap: t.oakCladdingNormal, normalScale: n(1.4), roughnessMap: t.oakCladdingRough, roughness: 1 }),
    oak: phys({ map: t.oakFloor, normalMap: t.oakFloorNormal, normalScale: n(0.6), roughnessMap: t.oakFloorRough, roughness: 1, clearcoat: 0.25, clearcoatRoughness: 0.35 }),
    walnut: phys({ map: t.walnut, normalMap: t.walnutNormal, normalScale: n(0.35), roughnessMap: t.walnutRough, roughness: 1, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    plaster: std({ map: t.plaster, normalMap: t.plasterNormal, normalScale: n(0.35), roughness: 0.93 }),
    concrete: std({ map: t.concrete, normalMap: t.concreteNormal, normalScale: n(0.8), roughness: 0.92 }),
    screed: std({ color: '#8f8a82', roughness: 0.95 }),
    bronze: phys({ color: '#5e4733', metalness: 1, roughnessMap: t.brushed, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.3 }),
    steel: std({ color: '#2b2a28', metalness: 0.8, roughness: 0.42 }),
    blackMetal: std({ color: '#1b1a19', metalness: 0.6, roughness: 0.38 }),
    charcoal: std({ color: '#262321', roughness: 0.85 }),
    glass: phys({
      color: '#d9e2e2',
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.12,
      ior: 1.52,
      specularIntensity: 1,
      envMapIntensity: 1.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    mirror: std({ color: '#c9c9c4', metalness: 1, roughness: 0.03 }),
    /** Glossy black glass of a switched-off screen. */
    screen: phys({ color: '#050506', metalness: 0.1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.3 }),
    fabric: phys({ map: t.fabric, normalMap: t.fabricNormal, normalScale: n(0.6), color: '#ddd5c7', roughness: 0.95, sheen: 1, sheenRoughness: 0.75, sheenColor: '#f2ece2' }),
    fabricDark: phys({ map: t.fabric, normalMap: t.fabricNormal, normalScale: n(0.6), color: '#6d665d', roughness: 0.95, sheen: 1, sheenRoughness: 0.7, sheenColor: '#9a9286' }),
    fabricOlive: phys({ map: t.fabric, normalMap: t.fabricNormal, normalScale: n(0.6), color: '#7c7a5c', roughness: 0.95, sheen: 1, sheenRoughness: 0.7, sheenColor: '#a4a283' }),
    fabricRust: phys({ map: t.fabric, normalMap: t.fabricNormal, normalScale: n(0.6), color: '#9a5f3e', roughness: 0.95, sheen: 1, sheenRoughness: 0.7, sheenColor: '#c48a65' }),
    linen: phys({ normalMap: t.fabricNormal, normalScale: n(0.35), color: '#f1ece3', roughness: 0.95, sheen: 0.8, sheenRoughness: 0.8, sheenColor: '#ffffff' }),
    sheer: phys({ normalMap: t.fabricNormal, normalScale: n(0.3), color: '#f4efe6', roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, sheen: 1, sheenColor: '#ffffff' }),
    rug: phys({ map: t.fabric, normalMap: t.fabricNormal, normalScale: n(1.2), color: '#a59985', roughness: 1, sheen: 0.6, sheenRoughness: 0.9, sheenColor: '#d6ccbb' }),
    leather: phys({ color: '#7a4f33', roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.5, sheen: 0.3, sheenColor: '#a87656' }),
    ceramic: phys({ color: '#f3f0ea', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    stoneware: std({ color: '#b7ab98', roughness: 0.8 }),
    paper: std({ color: '#e9e2d2', roughness: 0.95 }),
    bookA: std({ color: '#3d4a52', roughness: 0.8 }),
    bookB: std({ color: '#9b7b56', roughness: 0.8 }),
    bookC: std({ color: '#d8d0c0', roughness: 0.85 }),
    water: phys({ color: '#1b4a4f', roughness: 0.02, metalness: 0.05, normalMap: t.waterNormal, normalScale: n(0.25), envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.02 }),
    bathWater: phys({ color: '#c8d8d6', roughness: 0.02, transparent: true, opacity: 0.6, normalMap: t.waterNormal, normalScale: n(0.05), clearcoat: 1 }),
    lawn: std({ map: t.lawn, normalMap: t.lawnNormal, normalScale: n(0.8), roughness: 1, color: '#e4e2d2' }),
    gravel: std({ map: t.gravel, normalMap: t.gravelNormal, normalScale: n(1.2), roughness: 1 }),
    soil: std({ color: '#6a5a46', roughness: 1 }),
    foliage: std({ map: t.foliage, color: '#9aa17f', roughness: 0.95 }),
    foliageDark: std({ map: t.foliage, color: '#5a6249', roughness: 0.95 }),
    bark: std({ color: '#5b5046', roughness: 1 }),
    hedge: std({ map: t.foliage, color: '#55603f', roughness: 1 }),
    /** Warm light-emitting surfaces; intensity animated at dusk. */
    lamp: std({ color: '#2a2018', emissive: '#ffd6a0', emissiveIntensity: 2.2 }),
    shade: phys({ color: '#efe5d3', emissive: '#ffd9a8', emissiveIntensity: 0.6, roughness: 0.9, transmission: 0, sheen: 0.5 }),
    flame: std({ color: '#1a0f08', emissive: '#ff9548', emissiveIntensity: 2.5 }),
    /** Neutral massing material for stage and portfolio renders. */
    clay: std({ color: '#ece8e1', roughness: 0.92 }),
    clayDark: std({ color: '#b9b2a6', roughness: 0.92 }),
    line: new THREE.LineBasicMaterial({ color: '#3a352f' }),
  }
  return m
}
