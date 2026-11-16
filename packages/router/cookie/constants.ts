import { denialCodes, statusCodes } from '../constants'
import type { Routing } from '../types'

export const STATUS_COOKIE = 'fics-status' as const,
  STATUS_COOKIE_MAX_AGE_SEC = 10 as const

export const STATUS_PAGE_CODES: ReadonlySet<Routing.Status.PageCode> = new Set([
  ...Object.values(denialCodes),
  statusCodes.INTERNAL_SERVER_ERROR
])
