import { browserError } from '../core/helpers'

export default (href: string, isWithoutHistory?: boolean): void => {
  browserError()

  window.history[isWithoutHistory ? 'replaceState' : 'pushState']({}, '', href)
  window.dispatchEvent(new CustomEvent('fics:navigate', { detail: { href } }))
}
