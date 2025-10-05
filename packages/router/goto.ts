import { browserError } from '../core/helpers'

export default (href: string, isWithoutHistory?: boolean): void => {
  browserError()

  href = href.trim()
  if (href === '') return

  window.history[isWithoutHistory ? 'replaceState' : 'pushState']({}, '', href)
  window.dispatchEvent(new CustomEvent('fics:navigate', { detail: { href } }))
}
