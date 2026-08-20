import { browserError } from '../core/helpers'
import { FICS_STATUS } from './constants'
import type { Routing } from './types'

export const showStatus = (code: Routing.Status.PageCode): void => {
  browserError()

  const detail: Routing.Status.Event = { code, isHandled: false }
  window.dispatchEvent(new CustomEvent(FICS_STATUS, { detail }))

  if (!detail.isHandled)
    console.warn(`The showStatus(${code}) call was ignored as no router is currently mounted...`)
}
