import { browserError, isBlankString } from '../core/helpers'
import { FICS_CAN_NAVIGATE, FICS_NAVIGATE } from './constants'
import type { Routing } from './types'

export const goto = (
  href: string,
  { isWithoutHistory }: { isWithoutHistory: boolean } = { isWithoutHistory: false }
): void => {
  browserError()

  href = href.trim()
  if (isBlankString(href)) return

  const detail: Routing.CanNavigateEvent = { href, canNavigate: false }
  window.dispatchEvent(new CustomEvent(FICS_CAN_NAVIGATE, { detail }))

  if (!detail.canNavigate) return window.location[isWithoutHistory ? 'replace' : 'assign'](href)

  window.history[isWithoutHistory ? 'replaceState' : 'pushState']({}, '', href)
  window.dispatchEvent(new CustomEvent(FICS_NAVIGATE, { detail: { href } }))
}
