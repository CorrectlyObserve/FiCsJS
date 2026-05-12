import { browserError, isBlankString } from '../core/helpers'
import CUSTOM_EVENT_NAME from './constants'

export const goto = (
  href: string,
  { isWithoutHistory }: { isWithoutHistory: boolean } = { isWithoutHistory: false }
): void => {
  browserError()

  href = href.trim()
  if (isBlankString(href)) return

  window.history[isWithoutHistory ? 'replaceState' : 'pushState']({}, '', href)
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: { href } }))
}
