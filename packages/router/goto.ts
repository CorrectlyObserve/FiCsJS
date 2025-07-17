import { browserError } from '../core/helpers'
import type { RoutingOptions } from './types'

export default (
  href: string,
  { withHistory, reload }: RoutingOptions = { withHistory: true, reload: true }
): void => {
  browserError()

  if (withHistory && reload) window.location.href = href
  else window.history[withHistory ? 'pushState' : 'replaceState']({}, '', href)
}
