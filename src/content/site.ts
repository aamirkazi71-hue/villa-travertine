/**
 * Company details shared by every language. Copy lives in `en.ts` and `ar.ts`.
 *
 * Anything marked `PLACEHOLDER` is demonstration content and must be replaced
 * with confirmed information before the site is published. Empty strings are
 * deliberately left empty: the UI hides fields that have not been supplied
 * rather than inventing them.
 */

export const brand = {
  /** PLACEHOLDER — studio name (shown as written in both languages). */
  name: 'Halden & Vale',
  shortName: 'H&V',
  /** Leave empty until confirmed. The UI hides empty contact fields. */
  email: '',
  phone: '',
  /** International format without “+” or spaces, e.g. 971500000000. Enables the WhatsApp CTA. */
  whatsapp: '',
  address: '',
  /**
   * Optional endpoint that accepts a JSON POST of the enquiry form.
   * When empty, the form falls back to the email above (mailto),
   * and if that is empty too, it explains that enquiries are not yet connected.
   */
  enquiryEndpoint: '',
  legalName: '',
}

export type { Chapter, Material, NavItem, Project, Stage, Hotspot } from './types'
