import { numberError } from '../helpers'
import type { SetTimeout } from '../types'
import constants from './constants'

const {
  BASE_MS,
  JITTER_RATIO,
  MAX_MS,
  statusCode: { CLIENT_ERROR, REQUEST_TIMEOUT, SERVER_ERROR, TOO_MANY_REQUESTS }
} = constants

export const delay = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)

    const onAbort = (): void => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      timer: SetTimeout = setTimeout(() => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      }, ms)

    signal.addEventListener('abort', onAbort, { once: true })
  })

export const parseRetryAfter = (error: Response | unknown): number | null => {
  if (!(error instanceof Response)) return null

  const header: string | null = error.headers.get('Retry-After')
  if (!header) return null

  const seconds: number = Number(header)

  if (Number.isFinite(seconds)) {
    numberError({ seconds }, 'non-negative-int')

    const ms: number = seconds * 1_000
    return ms
  }

  const date: number = Date.parse(header),
    now: number = Date.now()

  numberError({ date }, 'positive-int')
  return Math.max(0, date - now)
}

export const getDelayToRetry = ({
  attempt,
  baseMs = BASE_MS,
  maxMs = MAX_MS,
  jitterRatio = JITTER_RATIO
}: {
  attempt: number
  baseMs?: number
  maxMs?: number
  jitterRatio?: number
}): number => {
  numberError({ attempt }, 'non-negative-int')
  numberError({ baseMs, maxMs }, 'positive-int')
  numberError({ jitterRatio }, 'ratio')

  const base: number = Math.min(baseMs * 2 ** (attempt - 1), maxMs)
  return base + Math.random() * base * jitterRatio
}

export const shouldRetry = (error: unknown): boolean => {
  const isIntentional: boolean = error instanceof DOMException && error.name === 'AbortError'
  if (isIntentional) return false

  if (error instanceof Response) {
    const { status }: { status: number } = error

    if (status === REQUEST_TIMEOUT || status === TOO_MANY_REQUESTS) return true
    if (status >= CLIENT_ERROR && status < SERVER_ERROR) return false
    return status >= SERVER_ERROR
  }

  const isNetworkError: boolean = error instanceof TypeError
  return isNetworkError
}

export const watch = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)

    const cleanup = (): void => signal.removeEventListener('abort', onAbort)
    const onAbort = (): void => {
      cleanup()
      reject(signal.reason)
    }

    signal.addEventListener('abort', onAbort, { once: true })

    promise.then(
      (value: T) => {
        cleanup()
        resolve(value)
      },
      (error: unknown) => {
        cleanup()
        reject(error)
      }
    )
  })
