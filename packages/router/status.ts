import { browserError, isBrowser } from '../core/helpers'
import { FICS_STATUS } from './constants'
import { decodeStatusCookie, encodeStatusCookie } from './cookie'
import type { Routing } from './types'

/** @remarks Clears unhandled status cookies, as prerendered pages cannot process them. */
if (isBrowser()) {
  const code: Routing.Status.PageCode | null = decodeStatusCookie(document.cookie)

  if (code !== null) {
    document.cookie = encodeStatusCookie(null, window.location.pathname)
    console.warn(`The showStatus(${code}) call was ignored, as no page handler read it...`)
  }
}

export const showStatus = (code: Routing.Status.PageCode): void => {
  browserError()

  const detail: Routing.Status.Event = { code, isHandled: false }
  window.dispatchEvent(new CustomEvent(FICS_STATUS, { detail }))

  /** @remarks Aborts the default reload, as the event was marked as handled. */
  if (detail.isHandled) return

  /** @remarks Reloads to let the page handler draw the status, as an island has no router. */
  document.cookie = encodeStatusCookie(code, window.location.pathname)
  window.location.reload()
}
