import {
  APPLICATION_JSON,
  CONTENT_TYPE,
  delay,
  getDelayMs,
  isClientTermination,
  isObject,
  MAX_RETRIES,
  numberError,
  removeTrailingSlash,
  shouldRetry,
  typedEntries
} from '../../core/helpers'
import type { SetTimeout } from '../../core/types'
import { statusCodes } from '../constants'
import { isBodiless } from '../helpers'
import type { Rpc } from '../types'
import { RPC_INPUT_PARAM } from './constants'
import { RpcError } from './error'
import { emitMetric } from './metric'

const codeByStatus: Record<number, keyof typeof statusCodes> = Object.fromEntries(
  typedEntries(statusCodes).map(([name, status]) => [status, name])
)

export const assertSafeSegment = (segment: string): string => {
  if (segment === '' || segment === '.' || segment === '..' || segment.includes('/'))
    throw new Error(`The RPC segment "${segment}" is invalid...`)
  return segment
}

/**
 * @param options.maxRetries Must be a non-negative integer if it is a number.
 * @param options.timeoutMs Must be a non-negative integer if it is a number.
 * @param options.intervalMs Must be a non-negative integer if it is a number.
 */
export const request = async ({
  basePath,
  path,
  input,
  method,
  headers,
  timeoutMs,
  intervalMs,
  maxRetries = MAX_RETRIES,
  onMetric,
  onDeny,
  signal
}: {
  basePath: string
  path: string
  input: unknown
  method: Rpc.Method
  headers: Headers
  signal?: AbortSignal
} & Omit<Rpc.Options.Client, 'headers'>): Promise<unknown> => {
  numberError({ timeoutMs, intervalMs, maxRetries }, 'non-negative-int')

  let url: string = `${removeTrailingSlash(basePath)}/${path}`,
    body: string | undefined

  if (input !== undefined)
    if (isBodiless(method)) {
      const separator: string = url.includes('?') ? '&' : '?'
      url += `${separator}${RPC_INPUT_PARAM}=${encodeURIComponent(JSON.stringify(input))}`
    } else {
      body = JSON.stringify(input)
      headers.set(CONTENT_TYPE, APPLICATION_JSON)
    }

  let attempt: number = 1
  while (true) {
    const startedAt: number = performance.now(),
      controller: AbortController = new AbortController(),
      cleanups: (() => void)[] = []

    if (signal)
      if (signal.aborted) controller.abort(signal.reason)
      else {
        const onAbort = (): void => controller.abort(signal!.reason)
        signal.addEventListener('abort', onAbort, { once: true })
        cleanups.push(() => signal!.removeEventListener('abort', onAbort))
      }

    let timer: SetTimeout | undefined
    if (timeoutMs && timeoutMs > 0)
      timer = setTimeout(
        () =>
          controller.abort(
            new DOMException(
              `The RPC "${path}" timed out after ${timeoutMs}ms in the ${method} method...`,
              'AbortError'
            )
          ),
        timeoutMs
      )

    emitMetric(onMetric, { type: 'request:start', path, method, attempt })

    let error: unknown
    try {
      const res: Response = await fetch(url, { method, headers, body, signal: controller.signal })
      if (!res.ok) throw res

      emitMetric(onMetric, {
        type: 'request:success',
        path,
        method,
        attempt,
        durationMs: performance.now() - startedAt
      })

      if (res.status === statusCodes.NO_CONTENT) return undefined

      const contentType: string = res.headers.get(CONTENT_TYPE)?.toLowerCase() ?? ''
      if (!contentType.startsWith(APPLICATION_JSON)) return undefined

      return await res.json()
    } catch (_error) {
      error = _error
    } finally {
      if (timer) clearTimeout(timer)
      for (const cleanup of cleanups) cleanup()
    }

    const willRetry: boolean = shouldRetry({ error, attempt, maxRetries, signal })

    emitMetric(onMetric, {
      type: 'request:error',
      path,
      method,
      attempt,
      durationMs: performance.now() - startedAt,
      error,
      willRetry
    })

    if (!willRetry) {
      const rpcError: RpcError = await toRpcError(error)

      if (rpcError.code === 'DENIED') onDeny?.(rpcError)
      throw rpcError
    }

    try {
      await delay(getDelayMs({ error, attempt, intervalMs }), signal)
    } catch (abortedError) {
      /** @remarks Surfaces the abort (not the fetch error) so RPC callers can tell cancellation from failure. */
      throw await toRpcError(abortedError)
    }

    attempt++
  }
}

export const resolveSegments = (segments: string[], lastArgs: unknown[] | null): string[] => {
  if (lastArgs === null) return segments

  const [arg, ..._options]: unknown[] = lastArgs
  return [...segments, assertSafeSegment(String(arg))]
}

const toRpcError = async (error: unknown): Promise<RpcError> => {
  if (error instanceof RpcError) return error

  if (error instanceof Response) {
    let message: string = `The RPC request failed with status ${error.status}...`,
      redirect: string | undefined

    try {
      const clonedError: unknown = await error.clone().json()
      if (isObject(clonedError) && 'error' in clonedError) {
        const { error } = clonedError as { error: Rpc.ErrorInit }

        if (isObject(error)) {
          if (typeof error.redirect === 'string') redirect = error.redirect

          const { status }: { status?: unknown } = error as { status?: unknown }
          if (typeof status === 'number')
            return new RpcError({
              code: 'DENIED',
              message: `The RPC request was denied with status ${status}...`,
              redirect,
              status
            })

          if (typeof error.message === 'string') message = error.message
        }
      }
    } catch {
      /** @remarks Falls back to the status-based generic error for non-JSON responses. */
    }

    const code: string | undefined = codeByStatus[error.status]
    return new RpcError({
      code: code ?? 'INTERNAL_SERVER_ERROR',
      message,
      redirect
    })
  }

  const name: string | undefined = isClientTermination(error) ? (error as DOMException).name : undefined
  return new RpcError({
    code: name === 'AbortError' ? 'ABORTED' : name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK',
    message: error instanceof Error ? error.message : String(error),
    expose: false
  })
}
