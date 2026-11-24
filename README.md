# Villa Travertine: scroll-driven architecture site

A cinematic website for an architecture and construction studio, built around one
contemporary villa that the visitor explores by scrolling: exterior → entrance →
living room → kitchen → stair → bedroom → bathroom → materials → engineering
assembly → dusk exterior → process → projects → consultation.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Append `?motion=reduce` to any URL to review the reduced-motion version without
changing OS settings.

## Languages: English and Arabic

- Copy lives in `src/content/en.ts` and `src/content/ar.ts`. Both have the same
  structure; TypeScript fails the build if a key is missing from either. Shared
  company details (name, email, phone, WhatsApp, form endpoint) live in
  `src/content/site.ts`.
- The language is chosen by `?lang=ar` in the link, then the visitor's last choice,
  then their browser language. The switch sits in the navigation.
- Arabic sets `dir="rtl"`: editorial grids mirror, and the time slider and form fields
  flip. Chapter text over the 3D view stays on the same physical side, because the
  camera framing leaves its negative space there.
- Arabic type: Amiri for statements and IBM Plex Sans Arabic for text. Only their
  Arabic subsets load, and only when Arabic is on screen. Letter-spacing, capitals and
  italics are switched off for Arabic, since they break joined script.

## Deployment (GitHub Pages)

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages. The build uses relative asset paths
(`base: './'`), so it works under the Pages project path or on a custom domain
without changes.

## How the imagery works (and its limits)

No photography or 3D assets were supplied, so the villa is a **procedural real-time
3D model** (Three.js) with physically plausible proportions:

| | |
|---|---|
| Ground floor | finished floor +0.45 m, 3.40 m clear |
| Upper floor | finished floor +4.20 m, 3.20 m clear |
| Living room | double height, ≈ 6.9 m clear, full-height garden glazing |
| Roof plate | 1.6 m projection past the garden glazing |
| Stair | 20 walnut treads cantilevered from a limestone spine wall, 21 risers of ≈ 179 mm |

Every image on the site comes from this one model, so the house stays consistent
from street to bathroom: the walkthrough, the exploded assembly, the six
construction-stage renders, the material samples, the dusk consultation image and
the reduced-motion stills. It looks like a finely made architectural model, **not
photography**, and the site says so (footer notice, captions, disclaimers).

To move to real assets later:

- **Rendered frames / photography:** replace the still requests (`useStill(...)`) with
  image URLs; the layouts already use stable aspect ratios.
- **A real villa model (glTF):** load it in `src/scene/engine.ts` in place of
  `buildVilla()`. Keep the layer tags (`foundation`, `gfStructure`, `ffSkin`, …) on
  its meshes and the engineering sequence keeps working.

## Structure

```
src/
  content/site.ts           ← all copy, brand and contact fields, projects (edit here)
  scene/
    villa.ts                ← the villa: walls with openings, glazing, stair, rooms, layers
    landscape.ts            ← site, terrace, pool, leaf-card trees, sky dome
    textures.ts             ← procedural limestone, travertine, oak, walnut, concrete…
    materials.ts            ← shared material library
    tracks.ts               ← camera keyframes + curves (door, explode, dusk)
    notes.ts                ← 3D-anchored annotations
    engine.ts               ← renderer, time of day, explode, notes, offscreen stills
    studio.ts               ← neutral scene for massing models and material samples
  components/
    CinematicVillaExperience.tsx  (+ scenes/ExteriorScene, Entrance, LivingRoom, Kitchen, PrivateSpaces)
    MaterialsSection · EngineeringReveal · ConstructionTimeline
    ProjectPortfolio · ConsultationSection · SiteNavigation · SiteFooter
    StaticVilla.tsx         ← reduced-motion / no-WebGL version of both sequences
```

### Scroll system

- One fixed `<canvas>` sits behind the page. The two villa sequences are tall,
  transparent sections; every other section is opaque and scrolls over the canvas.
- Native scrolling throughout: nothing is pinned or hijacked. GSAP ScrollTrigger
  maps scroll progress to a camera track. The engine follows it with critically
  damped smoothing and renders only while a sequence is on screen and something
  has changed.
- Keyframes marked `hold` ease in and out, so the camera settles where chapter
  text is read and keeps moving between chapters. Chapter text is placed at
  exactly those hold points (`at` in `site.ts` matches `p` in `tracks.ts`).
- Exposure is keyframed too, so moving from sunlit exterior to interior reads like a
  camera adapting.
- Lenis is deliberately not used: native scroll plus damping in the render loop gives
  the same feel without fighting ScrollTrigger.

### Design system

- Type: Cormorant Garamond (light, for statements only) with Manrope (everything
  that informs). Scale: `.t-display`, `.t-h1`–`.t-h3`, `.t-lede`, `.t-body`,
  `.t-label`, `.t-caption` in `src/index.css`.
- Palette tokens: ivory, limestone, stone, taupe, umber, charcoal, ink, oak,
  walnut, bronze.
- Light and dark sections alternate on purpose. The nav takes its ink colour and
  background from whatever section is beneath it (`data-nav`, `data-nav-bg`).

## Content that must be replaced before publishing

All placeholders live in `src/content/site.ts`:

- `brand.name` (currently **"Halden & Vale"**, an invented placeholder), `legalName`
- `email`, `phone`, `whatsapp`, `address`: deliberately empty; the UI hides them
- `enquiryEndpoint`: empty. The form validates fully, but when neither an endpoint
  nor an email is set it tells the visitor the enquiry was **not** sent.
- `projects`: four clearly labelled **demonstration entries** shown as abstract
  massing models, with no location. Replace them with completed projects and
  photography.
- Legal texts (privacy, terms, company information): the dialogs state that
  the text has not been supplied yet.

No awards, certifications, testimonials, statistics, suppliers or structural
claims are made. The engineering view is labelled as an illustrative assembly,
not a structural design.

## Accessibility and performance

- `prefers-reduced-motion`: no camera movement; the same model is rendered to
  stills and laid out as an editorial sequence.
- If WebGL is unavailable or the context is lost, the site falls back to the same
  static layout.
- Skip link, visible focus states, labelled form fields with inline errors and focus
  management, native `<dialog>` for project and legal details, keyboard-operable
  room index.
- Three.js loads as a separate chunk after the hero text renders. Offscreen stills
  render lazily as their sections approach, one at a time, in idle time.
- Phones get a lower pixel ratio and 2K shadow maps, portrait-specific camera
  framings, and a view offset that keeps the subject above the text card.

### Interaction

- **Time of day** (`src/scene/lighting.ts`, `TimeOfDayControl.tsx`): six measured
  lighting presets from 6:00 dawn to 23:00 night, interpolated for any hour. They set
  the sun, sky, clouds, stars, interior lamps and exposure. "Auto" returns to the tour's
  light: afternoon in the house, dusk at the end of the engineering sequence. Stills
  always use the tour's light.
- **Hotspots** (`src/scene/notes.ts` focus poses, `hotspotDetails` in `site.ts`,
  `AnnotationLayer.tsx`): labels with a `+` are buttons. The camera flies to a
  close-up, framed left of the detail card, and Esc, the close button or scrolling
  returns to the tour. Keyboard-reachable only while visible. Desktop only.
- **Ambient motion** (`engine.animate`): drifting clouds, twinkling stars, rippling
  pool and bath water, flickering fire and firelight, sheer curtains in a draught and
  trees in the wind. It renders at about 30 fps while the camera rests and is off for
  reduced motion.

### Realism pipeline

- **Lighting:** AgX filmic tone mapping. Reflections and ambient light come from
  the procedural sky itself (clouds included), rebaked as day turns to dusk. Indoors,
  sky light is reduced and soft area lights in each glazed opening provide
  window-lit falloff. The fireplace has an ember bed and layered flames.
- **Post-processing (desktop):** ground-truth ambient occlusion (GTAO) for contact
  shadows, subtle bloom on lamps, flames and glints, then a grade with contrast,
  saturation, vignette and fine grain. Phones render directly so they stay smooth.
  Stills (timeline, portfolio, materials) go through the same pipeline.
- **Materials:** every finish has a normal map for surface relief and, where the real
  material varies, a roughness map. Travertine floors are laid as jointed
  0.8 m slabs. Walnut and oak are oiled with a clearcoat; upholstery has a weave
  and sheen; bronze is brushed.
- **Geometry:** furniture uses bevelled edges. Turned objects (vases, basins, the
  oval bath) are lathed profiles. Hedges, trees and the indoor olives are clothed in
  alpha-tested leaf cards.
- **Living room TV:** a 77-inch wall-mounted panel on the fireplace breast, with its
  own camera beat over the sofa.

## Known limitations / next steps

- This is real-time rendering of a procedural model. It does not match an offline
  path-traced render or photography: there is no true global illumination, and
  the textures are generated rather than scanned. The biggest remaining gains would
  come from scanned PBR textures and an HDRI sky (for example CC0 assets from Poly
  Haven), or from replacing the model with a professionally modelled glTF.
- The model is deliberately restrained in furniture and detail; it is a
  demonstration of the experience, not a finished design.
- On this Windows machine the workspace sits under a redirected AppData folder,
  so `vite.config.ts` sets `resolve.preserveSymlinks`. That setting is harmless
  elsewhere.
