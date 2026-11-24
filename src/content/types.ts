/** Shapes shared by every language's content dictionary. */

export type NavItem = { label: string; href: string }

/** A chapter in a scroll sequence. `at` is the scroll progress (0–1) at which the slot fills the viewport. */
export type Chapter = {
  id: string
  at: number
  index: string
  label: string
  title: string[]
  body: string
  /** Physical side of the screen; kept in both languages because the camera framing leaves space there. */
  align: 'left' | 'right'
  tone: 'dark' | 'light'
  /** Set the text block high in the frame when the lower part holds the subject. */
  valign?: 'top'
  detail?: { k: string; v: string }[]
}

export type Material = {
  key: 'travertine' | 'limestone' | 'oak' | 'walnut' | 'bronze' | 'glass'
  name: string
  where: string
  why: string
}

export type Stage = { key: string; index: string; title: string; body: string }

export type Project = {
  id: string
  name: string
  category: string
  /** Leave empty until confirmed. */
  location: string
  status: string
  variant: 'courtyard' | 'hillside' | 'pavilion' | 'terrace'
  summary: string
}

export type Hotspot = { title: string; body: string; facts?: { k: string; v: string }[] }

export type Locale = 'en' | 'ar'
