import { browserError, isBlankString } from '../core/helpers'
import { FICS_NAVIGATE } from './constants'

export const goto = (
  href: string,
  { isWithoutHistory }: { isWithoutHistory: boolean } = { isWithoutHistory: false }
): void => {
  browserError()

  href = href.trim()
  if (isBlankString(href)) return

  window.history[isWithoutHistory ? 'replaceState' : 'pushState']({}, '', href)
  window.dispatchEvent(new CustomEvent(FICS_NAVIGATE, { detail: { href } }))
}
