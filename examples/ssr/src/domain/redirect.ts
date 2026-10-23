import { LOGIN_PATH } from '@/domain/path'

const BASE_URL = 'http://localhost' as const
const REDIRECT_PARAM = 'redirect' as const

export const toSafePath = (path: string | null): string | null => {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null

  try {
    const { pathname, search, hash }: URL = new URL(path, BASE_URL)

    if (pathname === LOGIN_PATH) return null

    const safe = `${pathname}${search}${hash}` as const
    return safe.startsWith('//') ? null : safe
  } catch {
    return null
  }
}

export const readRedirect = (url: string): string | null =>
  toSafePath(new URL(url, BASE_URL).searchParams.get(REDIRECT_PARAM))

export const viaLogin = (redirect: string | null): string =>
  redirect === null ? LOGIN_PATH : `${LOGIN_PATH}?${REDIRECT_PARAM}=${encodeURIComponent(redirect)}`
