import { browserError } from '../core/helpers'
import CUSTOM_EVENT_NAME from './customEvent'

export default (href: string, isWithoutHistory?: boolean): void => {
  browserError()

  href = href.trim()
  if (href === '') return

  window.history[isWithoutHistory ? 'replaceState' : 'pushState']({}, '', href)
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: { href } }))
}
