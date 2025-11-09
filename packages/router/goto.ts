import { browserError } from '../core/helpers'
import CUSTOM_EVENT_NAME from './const'

export default (
  href: string,
  { isWithoutHistory }: { isWithoutHistory: boolean } = { isWithoutHistory: false }
): void => {
  browserError()

  href = href.trim()
  if (href === '') return

  window.history[isWithoutHistory ? 'replaceState' : 'pushState']({}, '', href)
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: { href } }))
}
