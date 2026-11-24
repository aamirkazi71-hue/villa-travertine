import type { Chapter, Hotspot, Locale, Material, NavItem, Project, Stage } from './types'

/**
 * English copy. `ar.ts` mirrors this structure exactly (TypeScript enforces it).
 * Company contact details are shared and live in `site.ts`.
 */
export const en = {
  meta: {
    title: 'Villa Travertine — Architecture & Construction',
    description: 'A scroll-driven walkthrough of a contemporary villa, from arrival to engineering, by an architecture and construction studio.',
  },
  brandDescriptor: 'Architecture & Construction',
  demoNotice:
    'Every image on this site comes from a real-time 3D model of a demonstration residence, built to show how the studio works. It is not photography of a completed project.',

  navigation: [
    { label: 'The Villa', href: '#villa' },
    { label: 'Materials', href: '#materials' },
    { label: 'Engineering', href: '#engineering' },
    { label: 'Process', href: '#process' },
    { label: 'Projects', href: '#projects' },
  ] as NavItem[],

  hero: {
    label: 'Villa Travertine — Demonstration Residence',
    headline: ['Built to be', 'experienced.'],
    supporting: 'Where considered architecture meets uncompromising craftsmanship.',
    meta: [
      { k: 'Typology', v: 'Private residence' },
      { k: 'Storeys', v: 'Two, with a double-height living room' },
      { k: 'Palette', v: 'Limestone · Travertine · Oak · Bronze' },
    ],
  },

  villaChapters: [
    {
      id: 'entrance',
      at: 0.16,
      index: '01',
      label: 'Arrival',
      title: ['A threshold,', 'not just a door.'],
      body: 'The entrance is set back 1.2 m into the plan, beneath the upper storey. Three shallow limestone steps lift the house clear of the garden, and the recess gives shelter before the oak pivot door turns open.',
      align: 'left',
      tone: 'dark',
      detail: [
        { k: 'Recess', v: '1.2 m beneath the upper volume' },
        { k: 'Door', v: 'Oak pivot, 3.0 m high' },
      ],
    },
    {
      id: 'hall',
      at: 0.27,
      index: '02',
      label: 'Entrance Hall',
      title: ['Light marks the line', 'between in and out.'],
      body: 'Inside and outside share the same pale stone. You can tell you have crossed the threshold because the light changes: the hall sits in shadow, and the living room beyond is lit from above.',
      align: 'right',
      tone: 'dark',
    },
    {
      id: 'living',
      at: 0.4,
      index: '03',
      label: 'Living Room',
      title: ['A room the full', 'height of the house.'],
      body: 'The living room rises through both storeys. The garden wall is glazed from floor to roof, and the roof plate projects 1.6 m beyond it. Three narrow slots in the street wall let in sun as long bars of light that move across the floor during the day.',
      align: 'left',
      tone: 'dark',
      valign: 'top',
      detail: [
        { k: 'Clear height', v: '≈ 6.9 m' },
        { k: 'Roof projection', v: '1.6 m past the glazing' },
      ],
    },
    {
      id: 'kitchen',
      at: 0.56,
      index: '04',
      label: 'Kitchen & Dining',
      title: ['Storage on the street side,', 'garden on the other.'],
      body: 'Tall oak joinery runs along the street wall and holds storage, appliances and a stone-lined niche. With no wall cabinets on the garden side, the glazing can run the full length of the room. The island is one 4.2 m piece of travertine, and its stone turns down at both ends to meet the floor.',
      align: 'left',
      tone: 'dark',
      detail: [
        { k: 'Island', v: 'Travertine, 4.2 m, waterfall ends' },
        { k: 'Table', v: 'Walnut, seats eight' },
      ],
    },
    {
      id: 'stair',
      at: 0.7,
      index: '05',
      label: 'The Stair',
      title: ['Climbing', 'toward the light.'],
      body: 'Twenty walnut treads project from the stone wall with no stringer beneath them, so the stair reads as a series of thin planes in front of the glass. A roof light directly overhead washes the wall as you climb.',
      align: 'left',
      tone: 'dark',
    },
    {
      id: 'private',
      at: 0.885,
      index: '06',
      label: 'Principal Suite',
      title: ['Privacy from height,', 'a view through glass.'],
      body: 'The bedroom sits above the kitchen wing and looks across the garden, away from the street. A dressing room separates it from the landing, so you reach it through storage instead of straight from the stair.',
      align: 'right',
      tone: 'dark',
    },
    {
      id: 'bath',
      at: 0.965,
      index: '07',
      label: 'Bathroom',
      title: ['The bath faces', 'the trees.'],
      body: 'Travertine lines the floor and walls as one continuous surface. The vanity sits on the inner wall, which keeps the window clear for the freestanding bath. The bath sits below the garden’s tree canopy, so you can see out but nobody can see in.',
      align: 'left',
      tone: 'dark',
    },
  ] as Chapter[],

  engineeringChapters: [
    {
      id: 'assembly',
      at: 0.3,
      index: '08',
      label: 'Engineering',
      title: ['What holds', 'it all up.'],
      body: 'This is the same model, separated along its construction joints. From the ground up: foundation slab, ground-floor walls and steel columns, the first-floor slab with its screed and finish, the upper walls behind their oak cladding, and the roof plate that carries the overhang.',
      align: 'left',
      tone: 'dark',
    },
    {
      id: 'facade',
      at: 0.5,
      index: '09',
      label: 'Facade Layers',
      title: ['Skin and', 'structure.'],
      body: 'The stone and oak are a cladding layer, held clear of the structural wall behind. Separating the two lets the structure be designed for loads and the finish be chosen for weathering and appearance.',
      align: 'right',
      tone: 'dark',
    },
    {
      id: 'dusk',
      at: 0.94,
      index: '10',
      label: 'Return',
      title: ['The house at', 'the end of the day.'],
      body: 'At dusk the glazed garden wall turns into a lantern, with the stair, gallery and living room on view.',
      align: 'left',
      tone: 'light',
    },
  ] as Chapter[],

  engineeringDisclaimer:
    'Illustrative assembly of a demonstration model. It shows typical construction layers and is not a structural design or specification.',

  materialsSection: {
    label: 'Materials & Craft',
    title: ['Six materials,', 'used with restraint.'],
    lede: 'The palette was fixed early in design. Using fewer materials means fewer junctions between them, so each junction can be detailed properly.',
    caption: 'Samples are rendered from the same material definitions as the villa model. They are illustrative and do not specify grade, finish or supplier.',
    alt: (name: string) => `${name} sample under low raking light`,
  },

  materials: [
    {
      key: 'limestone',
      name: 'Limestone',
      where: 'Exterior walls, plinth, entrance steps',
      why: 'Long, shallow coursing makes the base of the house read horizontally against the ground. The stone weathers slowly and evenly.',
    },
    {
      key: 'travertine',
      name: 'Travertine',
      where: 'Floors, kitchen island, bathroom, rear terrace',
      why: 'One stone runs from the terrace through the living spaces. It is specified honed rather than polished, so it stays matt underfoot.',
    },
    {
      key: 'oak',
      name: 'Oak',
      where: 'Upper-storey cladding, pivot door, joinery',
      why: 'Vertical battens give the upper volume a finer grain than the stone base below, so the two storeys read as different weights.',
    },
    {
      key: 'walnut',
      name: 'Walnut',
      where: 'Stair treads, dining table, headboard wall',
      why: 'A darker timber for the surfaces people touch most. It also gives the stair visual weight against the pale wall behind it.',
    },
    {
      key: 'bronze',
      name: 'Bronze',
      where: 'Window frames, fascia, pendants, handles',
      why: 'A dark, warm metal that keeps frames slim. It sits closer in tone to the oak and stone than black steel or anodised aluminium would.',
    },
    {
      key: 'glass',
      name: 'Glass',
      where: 'Garden wall, bedroom, roof light',
      why: 'Used in large panes with few divisions where the view matters, and kept to slots and clerestories where privacy matters.',
    },
  ] as Material[],

  processSection: {
    label: 'Process',
    title: ['From drawing', 'to handover.'],
    stagesAria: 'Stages',
    alt: (index: string, title: string) => `Stage ${index}, ${title}: illustrative render of the demonstration model`,
  },

  stages: [
    {
      key: 'planning',
      index: '01',
      title: 'Architectural planning',
      body: 'Survey, brief and design development. Architecture, structure and services are coordinated on drawings before any work starts on site.',
    },
    {
      key: 'site',
      index: '02',
      title: 'Site preparation',
      body: 'Setting out, excavation and the foundation slab. Floor levels, drainage and service entries are fixed at this stage, so mistakes here are expensive to correct later.',
    },
    {
      key: 'structure',
      index: '03',
      title: 'Structural construction',
      body: 'Walls, columns, the first-floor slab and the roof plate. The frame is completed and checked before any finishes go on.',
    },
    {
      key: 'envelope',
      index: '04',
      title: 'Building envelope',
      body: 'Cladding, glazing, roofing and fascias. Once the envelope is complete the house is weathertight, and interior work can proceed in controlled conditions.',
    },
    {
      key: 'interiors',
      index: '05',
      title: 'Interior finishing',
      body: 'Stone floors, joinery, stair treads and bathroom finishes. Most of the craft time on a house like this is spent here.',
    },
    {
      key: 'handover',
      index: '06',
      title: 'Final handover',
      body: 'Landscape, commissioning, snagging and documentation. Handover is complete only when everything has been tested and recorded.',
    },
  ] as Stage[],

  processDisclaimer: 'Illustrative stages, rendered from the demonstration model. They do not document a real project.',

  projectsSection: {
    label: 'Selected work',
    title: 'Projects',
    note: 'The entries below are demonstration placeholders. Each one stands in for a completed project, which should be added with its own photography and confirmed details.',
    view: 'View',
    locationMissing: 'Location not yet supplied',
    notSupplied: 'Not yet supplied',
    category: 'Category',
    location: 'Location',
    status: 'Status',
    dialogLabel: (name: string) => `${name} details`,
    dialogFallback: 'Project details',
    altCard: (name: string) => `${name}: abstract massing model (demonstration entry)`,
    altDetail: (name: string) => `${name}: abstract massing model`,
  },

  /** PLACEHOLDER — demonstration entries. Replace with completed projects and real photography. */
  projects: [
    {
      id: 'courtyard',
      name: 'Courtyard House',
      category: 'Private residence',
      location: '',
      status: 'Demonstration entry',
      variant: 'courtyard',
      summary: 'Placeholder entry showing how a courtyard-plan house would appear. Replace with a completed project, its photography and confirmed details.',
    },
    {
      id: 'hillside',
      name: 'Hillside Residence',
      category: 'Private residence',
      location: '',
      status: 'Demonstration entry',
      variant: 'hillside',
      summary: 'Placeholder entry for a stepped house on a sloping site. Replace with a completed project, its photography and confirmed details.',
    },
    {
      id: 'pavilion',
      name: 'Garden Pavilion',
      category: 'Outbuilding',
      location: '',
      status: 'Demonstration entry',
      variant: 'pavilion',
      summary: 'Placeholder entry for a single-room garden building. Replace with a completed project, its photography and confirmed details.',
    },
    {
      id: 'terrace',
      name: 'Terrace Houses',
      category: 'Small development',
      location: '',
      status: 'Demonstration entry',
      variant: 'terrace',
      summary: 'Placeholder entry for a short row of houses. Replace with a completed project, its photography and confirmed details.',
    },
  ] as Project[],

  consultation: {
    label: 'Consultation',
    headline: ['Let’s build something', 'extraordinary.'],
    approach:
      'Every project starts with a conversation about the site, the brief and the budget. We will tell you early what is achievable and what it is likely to involve.',
    heroAlt: 'The demonstration villa from the forecourt at dusk, its light slots and entrance lit from within',
    cta: 'Request a consultation',
    formTitle: ['Tell us about', 'the site and the brief.'],
    formIntro: 'You do not need drawings or a fixed budget yet. A location and a rough idea of scope are enough to start the conversation.',
    required: 'Fields marked * are required.',
    fields: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      location: 'Site location',
      locationPlaceholder: 'Town or region',
      type: 'Project type',
      timeline: 'Timeline',
      message: 'About the project',
      select: 'Select',
    },
    projectTypes: ['New residence', 'Renovation', 'Extension', 'Interior fit-out', 'Other'],
    timelines: ['Within 6 months', '6–12 months', '12 months or more', 'Not yet known'],
    consent: { before: 'I agree to these details being used to reply to my enquiry. See the', link: 'privacy notice', after: '.' },
    send: 'Send enquiry',
    sending: 'Sending…',
    whatsapp: 'Or message on WhatsApp',
    whatsappText: 'Hello, I would like to discuss a project.',
    errors: {
      name: 'Please enter your name.',
      email: 'Please enter an email address.',
      emailInvalid: 'That email address does not look complete.',
      message: 'A few lines about the project will help us respond properly.',
      consent: 'We need your agreement to use these details to reply.',
    },
    status: {
      sent: 'Thank you. Your enquiry has been sent, and we will reply by email.',
      mail: 'Your email app should now open with the enquiry ready to send. If it does not, please copy your message and email us directly.',
      unconfigured: 'This demonstration form is not yet connected to an inbox, so your enquiry has not been sent. Nothing you entered has been stored.',
      failed: 'Something went wrong and the enquiry was not sent. Please try again in a moment.',
    },
    mailSubject: (name: string) => `Consultation request — ${name}`,
    contactPending: 'Studio contact details will appear here once they have been confirmed.',
    contactLabels: { email: 'Email', phone: 'Telephone', address: 'Studio' },
  },

  footer: {
    aria: 'Footer',
    explore: 'Explore',
    contact: 'Contact',
    consultation: 'Consultation',
    enquiryForm: 'Enquiry form',
    contactPending: 'Contact details to be confirmed.',
    legal: 'Legal',
    legalPending: (label: string) =>
      `This text has not been supplied yet. The studio’s confirmed ${label.toLowerCase()} text should be added here before the site is published.`,
  },

  legal: [
    { id: 'privacy', label: 'Privacy' },
    { id: 'terms', label: 'Terms' },
    { id: 'imprint', label: 'Company information' },
  ],

  /** Labels pinned to the 3D model (keys match src/scene/notes.ts). */
  noteLabels: {
    porch: 'Recessed entrance beneath the upper storey',
    glazing: 'Full-height glazing, bronze frame',
    tv: '77-inch screen above the fireplace',
    fireplace: 'Linear fireplace in a limestone breast',
    stair: 'Cantilevered walnut treads',
    skylight: 'Roof light over the stair',
    island: 'Travertine island, 4.2 m',
    joinery: 'Floor-to-ceiling oak joinery',
    table: 'Walnut table for eight',
    spine: 'Limestone spine wall carries the stair',
    bedGlazing: 'Garden glazing, set back under the roof',
    tub: 'Freestanding bath at the window',
    eRoof: 'Roof plate and overhang',
    eFfSkin: 'Upper walls',
    eFfFloor: 'Screed and floor finish',
    eFfSlab: 'First-floor structural slab',
    columns: 'Steel columns, ground floor',
    eFoundation: 'Foundation slab',
    slotsSkin: 'Limestone cladding, held off the wall',
    oakSkin: 'Oak battens on the upper storey',
  } as Record<string, string>,

  /** Detail cards for clickable hotspots in the walkthrough (keys match src/scene/notes.ts). */
  hotspotDetails: {
    porch: {
      title: 'Recessed entrance',
      body: 'The front door sits 1.2 m back under the upper storey, so you arrive under cover. The soffit overhead is lined with the same oak battens as the facade above it.',
      facts: [{ k: 'Door', v: 'Oak pivot, 1.5 m × 3.0 m' }, { k: 'Steps', v: 'Three limestone risers of 150 mm' }],
    },
    glazing: {
      title: 'Garden glazing',
      body: 'Nine metres of glass in six bays, divided once at the line of the upper floor. Slim bronze frames keep the view open, and the roof projects 1.6 m beyond the glass to shade it.',
      facts: [{ k: 'Height', v: '≈ 6.9 m, floor to roof' }, { k: 'Frame', v: 'Bronze, 50 mm sightline' }],
    },
    tv: {
      title: '77-inch screen',
      body: 'Mounted on the fireplace breast above the firebox and centred on the sofa. Cabling is designed to run concealed inside the breast, so nothing shows on the stone.',
      facts: [{ k: 'Panel', v: '1.71 m × 0.98 m' }, { k: 'Centre height', v: '1.9 m above the floor' }],
    },
    fireplace: {
      title: 'Linear fireplace',
      body: 'A 4 m firebox set low in a limestone breast, with a stone hearth bench running the length of the wall. At seated eye level, the fire is part of the room rather than a feature on the wall.',
      facts: [{ k: 'Firebox', v: '4.0 m × 0.45 m' }, { k: 'Hearth bench', v: 'Limestone, 9.2 m' }],
    },
    stair: {
      title: 'Cantilevered stair',
      body: 'Twenty walnut treads project from the limestone spine wall with no stringer beneath. A frameless glass balustrade on the open side keeps the stair visually light against the glazing.',
      facts: [{ k: 'Risers', v: '21 × ≈ 179 mm' }, { k: 'Going', v: '280 mm' }],
    },
    skylight: {
      title: 'Roof light',
      body: 'A long roof light runs directly over the stair, so daylight falls down the face of the stone wall and you climb toward it.',
      facts: [{ k: 'Opening', v: '1.0 m × 5.6 m' }],
    },
    island: {
      title: 'Travertine island',
      body: 'One 4.2 m run of travertine at working height, with the stone turned down at both ends to meet the floor. The hob and sink face the garden; stools sit on the garden side.',
      facts: [{ k: 'Length', v: '4.2 m' }, { k: 'Worktop height', v: '920 mm' }],
    },
    joinery: {
      title: 'Oak joinery wall',
      body: 'Floor-to-ceiling oak cabinets along the street wall hold storage and appliances, with a travertine-lined niche for everyday use. Shadow gaps between the doors replace handles.',
      facts: [{ k: 'Height', v: 'To 3.15 m' }],
    },
    table: {
      title: 'Dining table',
      body: 'A walnut table for eight set beside the garden glazing, under a linear bronze pendant that runs its full length.',
      facts: [{ k: 'Table', v: '3.2 m × 1.1 m' }],
    },
    spine: {
      title: 'Limestone spine wall',
      body: 'A single stone wall rising through both storeys. It carries the cantilevered stair and separates the double-height living room from the hall and kitchen.',
      facts: [{ k: 'Height', v: 'Ground floor to roof' }],
    },
    bedGlazing: {
      title: 'Bedroom glazing',
      body: 'Full-height glass faces the garden, not the street. Sheer linen curtains soften morning light without closing off the view.',
      facts: [{ k: 'Width', v: '6.0 m' }],
    },
    tub: {
      title: 'Freestanding bath',
      body: 'An oval bath placed at the window, below the line of the garden trees. A floor-standing bronze filler keeps the window wall clear.',
      facts: [{ k: 'Bath', v: '1.8 m × 0.8 m' }],
    },
  } as Record<string, Hotspot>,

  /** Interface text that is not section copy. */
  ui: {
    skip: 'Skip to content',
    backToTop: (name: string) => `${name}, back to top`,
    navPrimary: 'Primary',
    navMobile: 'Mobile',
    enquire: 'Enquire',
    menu: 'Menu',
    close: 'Close',
    /** Points “forward” in reading direction. */
    arrow: '→',
    backArrow: '←',
    language: { label: 'العربية', aria: 'عرض الموقع باللغة العربية', lang: 'ar' as Locale },
    scrollCue: 'Scroll to enter the house',
    rooms: 'Rooms',
    villaAria: 'Villa walkthrough',
    engineeringAria: 'Engineering and construction layers',
    engineeringShort: 'Engineering',
    rendering: 'Rendering view…',
    noWebgl: '3D rendering is not available on this device.',
    heroAlt: 'Street elevation of the demonstration villa in afternoon light',
    chapterAlt: (label: string) => `${label}: view of the demonstration model`,
    detail: 'Detail',
    backToTour: 'Back to the tour',
    backHint: 'Or press Esc, or keep scrolling.',
    viewDetail: (label: string) => `${label}: view detail`,
    light: 'Light',
    auto: 'Auto',
    dawn: 'Dawn',
    noon: 'Noon',
    night: 'Night',
    spokenTime: (h: number, m: number) => {
      const suffix = h < 12 ? 'am' : 'pm'
      const h12 = h % 12 === 0 ? 12 : h % 12
      return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${suffix}`
    },
  },
}

export type Content = typeof en
