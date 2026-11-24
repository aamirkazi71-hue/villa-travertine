import type { TrackName } from './tracks'

/** Annotation definitions: anchored to model points, visible inside a progress window. */
export type Focus = { pos: [number, number, number]; look: [number, number, number]; fov: number }

/** A note with a `focus` is a clickable hotspot: the camera flies to that close-up and a detail card opens. */
export type Note = { key: string; anchor: string; label: string; track: TrackName; from: number; to: number; side?: 'left' | 'right'; focus?: Focus }

export const notes: Note[] = [
  { key: 'porch', anchor: 'porch', label: 'Recessed entrance beneath the upper storey', track: 'walk', from: 0.13, to: 0.19, focus: { pos: [-0.6, 1.62, 8.4], look: [-1.3, 2.3, 4.8], fov: 44 } },
  { key: 'glazing', anchor: 'glazing', label: 'Full-height glazing, bronze frame', track: 'walk', from: 0.37, to: 0.43, side: 'right', focus: { pos: [-8.2, 1.45, -3.4], look: [-9.4, 3.9, -6], fov: 50 } },
  { key: 'tv', anchor: 'tv', label: '77-inch screen above the fireplace', track: 'walk', from: 0.44, to: 0.47, side: 'right', focus: { pos: [-8.3, 2.05, 0.6], look: [-11.25, 2.28, -0.05], fov: 42 } },
  { key: 'fireplace', anchor: 'fireplace', label: 'Linear fireplace in a limestone breast', track: 'walk', from: 0.44, to: 0.47, side: 'right', focus: { pos: [-9.2, 1.15, 1.4], look: [-11.5, 1.12, -0.2], fov: 44 } },
  { key: 'stair', anchor: 'stair', label: 'Cantilevered walnut treads', track: 'walk', from: 0.68, to: 0.725, focus: { pos: [-5.6, 1.15, -0.4], look: [-3.5, 2.2, -2.9], fov: 52 } },
  { key: 'skylight', anchor: 'skylight', label: 'Roof light over the stair', track: 'walk', from: 0.68, to: 0.725, focus: { pos: [-5.2, 1.7, 0.3], look: [-3.5, 7.4, -2.6], fov: 56 } },
  { key: 'island', anchor: 'island', label: 'Travertine island, 4.2 m', track: 'walk', from: 0.54, to: 0.585, focus: { pos: [9.1, 1.6, 1.45], look: [7.6, 1.05, 3.0], fov: 40 } },
  { key: 'joinery', anchor: 'joinery', label: 'Floor-to-ceiling oak joinery', track: 'walk', from: 0.54, to: 0.585, side: 'left', focus: { pos: [5.9, 1.65, 3.85], look: [6.0, 1.5, 5.6], fov: 50 } },
  { key: 'table', anchor: 'table', label: 'Walnut table for eight', track: 'walk', from: 0.54, to: 0.585, focus: { pos: [5.6, 2.25, -0.9], look: [5.6, 0.95, -3.1], fov: 48 } },
  { key: 'spine', anchor: 'spine', label: 'Limestone spine wall carries the stair', track: 'walk', from: 0.68, to: 0.725, focus: { pos: [-6.6, 1.6, -2.4], look: [-3.0, 3.0, -2.8], fov: 52 } },
  { key: 'bedGlazing', anchor: 'bedGlazing', label: 'Garden glazing, set back under the roof', track: 'walk', from: 0.87, to: 0.905, side: 'left', focus: { pos: [7.6, 5.75, -3.0], look: [7.6, 5.55, -6.5], fov: 54 } },
  { key: 'tub', anchor: 'tub', label: 'Freestanding bath at the window', track: 'walk', from: 0.95, to: 1.01, side: 'left', focus: { pos: [2.6, 5.45, -3.75], look: [1.8, 4.55, -5.5], fov: 50 } },
  { key: 'eRoof', anchor: 'eRoof', label: 'Roof plate and overhang', track: 'assembly', from: 0.22, to: 0.4 },
  { key: 'eFfSkin', anchor: 'eFfSkin', label: 'Upper walls', track: 'assembly', from: 0.22, to: 0.4 },
  { key: 'eFfFloor', anchor: 'eFfFloor', label: 'Screed and floor finish', track: 'assembly', from: 0.22, to: 0.4 },
  { key: 'eFfSlab', anchor: 'eFfSlab', label: 'First-floor structural slab', track: 'assembly', from: 0.22, to: 0.4 },
  { key: 'columns', anchor: 'columns', label: 'Steel columns, ground floor', track: 'assembly', from: 0.22, to: 0.4 },
  { key: 'eFoundation', anchor: 'eFoundation', label: 'Foundation slab', track: 'assembly', from: 0.22, to: 0.4 },
  { key: 'slotsSkin', anchor: 'eGfSkin', label: 'Limestone cladding, held off the wall', track: 'assembly', from: 0.44, to: 0.56 },
  { key: 'oakSkin', anchor: 'eFfSkin', label: 'Oak battens on the upper storey', track: 'assembly', from: 0.44, to: 0.56 },
]
