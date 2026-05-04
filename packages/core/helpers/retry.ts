import type { SetTimeout } from '../types'
import constants from './constants'
import numberError from './numberError'

const {
  INTERVAL_MS,
  JITTER_RATIO,
  MAX_DELAY_MS,
  statusCode: { CLIENT_ERROR, REQUEST_TIMEOUT, SERVER_ERROR, TOO_MANY_REQUESTS }
} = constants

/** @param ms Must be a non-negative integer. */
export const delay = (ms: number, signal?: AbortSignal): Promise<void> => {
  numberError({ ms }, 'non-negative-int')

  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)

    const onAbort = (): void => {
        cleanup()
        reject(signal?.reason)
      },
      cleanup = (): void => {
        signal?.removeEventListener('abort', onAbort)
        clearTimeout(timer)
      }

    const timer: SetTimeout = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * @param attempt Must be a positive integer.
 * @param intervalMs Must be a non-negative integer if it is a number.
 * @param maxDelayMs Must be a non-negative integer if it is a number.
 * @param jitterRatio Must be a number between 0 and 1 if it is a number.
 */
export const getDelayMs = ({
  error,
  attempt,
  baseMs = BASE_MS,
  maxMs = MAX_MS,
  jitterRatio = JITTER_RATIO
}: {
  error: unknown
  attempt: number
  intervalMs?: number
  maxDelayMs?: number
  jitterRatio?: number
}): number => {
  numberError({ attempt }, 'positive-int')
  numberError({ intervalMs, maxDelayMs }, 'non-negative-int')
  numberError({ jitterRatio }, 'ratio')

  const retryAfterMs: number | null = parseRetryAfter(error)
  if (retryAfterMs !== null) return retryAfterMs

  const baseMs: number = Math.min(intervalMs * 2 ** (attempt - 1), maxDelayMs)

  /** @remarks Prevents DDoS by adding jitterRatio to the retry delay. */
  return baseMs + Math.random() * baseMs * jitterRatio
}

const parseRetryAfter = (error: Response | unknown): number | null => {
  if (!(error instanceof Response)) return null

  const header: string | null = error.headers.get('Retry-After')
  if (!header) return null

  const seconds: number = Number(header)

  if (Number.isFinite(seconds)) {
    if (seconds < 0) return null

    const ms: number = seconds * 1_000
    return ms
  }

  const date: number = Date.parse(header)
  if (!Number.isFinite(date)) return null

  return Math.max(0, date - Date.now())
}

export const watch = <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)

    const cleanup = (): void => signal?.removeEventListener('abort', onAbort)
    const onAbort = (): void => {
      cleanup()
      reject(signal?.reason)
    }

    signal?.addEventListener('abort', onAbort, { once: true })

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
