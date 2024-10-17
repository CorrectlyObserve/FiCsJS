import { throwWindowError } from '../core/errors'

export default (
  href: string,
  { history, reload }: { history?: boolean; reload?: boolean } = { history: true, reload: true }
): void => {
  throwWindowError()

  if (history) {
    if (reload) window.location.href = href
    else window.history.pushState({}, '', href)
  } else window.history.replaceState({}, '', href)
}
