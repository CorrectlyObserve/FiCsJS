import { throwWindowError } from '../core/helpers'

export default (
  href: string,
  { history, reload }: { history?: boolean; reload?: boolean } = { history: true, reload: true }
): void => {
  throwWindowError()

  if (history) reload ? (window.location.href = href) : window.history.pushState({}, '', href)
  else window.history.replaceState({}, '', href)
}
