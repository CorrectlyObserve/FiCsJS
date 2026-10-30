import { STATUS_COOKIE, STATUS_COOKIE_MAX_AGE_SEC, STATUS_PAGE_CODES } from './constants'
import type { Routing } from '../types'

const isStatusPageCode = (code: number): code is Routing.Status.PageCode =>
  STATUS_PAGE_CODES.has(code as Routing.Status.PageCode)

export const decodeStatusCookie = (cookies: string): Routing.Status.PageCode | null => {
  const statusCookie: string | undefined = cookies
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith(`${STATUS_COOKIE}=`))
      ?.slice(STATUS_COOKIE.length + 1),
    pageCode: number = Number(statusCookie)

  return isStatusPageCode(pageCode) ? pageCode : null
}

export const encodeStatusCookie = (code: Routing.Status.PageCode | null, path: string): string =>
  `${STATUS_COOKIE}=${code ?? ''}; path=${path}; max-age=${code === null ? 0 : STATUS_COOKIE_MAX_AGE_SEC}; samesite=strict`
