import {
  APPLICATION_JSON,
  CONTENT_TYPE,
  delay,
  forwardAbort,
  getDelayMs,
  isBlankString,
  isClientTermination,
  isIdempotentMethod,
  isObject,
  MAX_RETRIES,
  numberError,
  removeTrailingSlash,
  scheduleAbort,
  shouldRetry,
  typedEntries
} from '../../core/helpers'
import { statusCodes } from '../constants'
import { isBodiless } from '../helpers'
import type { Routing, Rpc } from '../types'
import { DENIED_HEADER, REDIRECT_HEADER, RPC_INPUT_PARAM } from './constants'
import { RpcError } from './error'
import { emitMetric } from './metric'
import { showStatus } from '../status'

const codeByStatus: Record<number, Routing.Status.Name> = Object.fromEntries(
  typedEntries(statusCodes).map(([name, status]) => [status, name])
)

export const assertSafeSegment = (segment: string): string => {
  const trimmed: string = segment.trim()

  if (isBlankString(segment) || segment.includes('/') || trimmed === '.' || trimmed === '..')
    throw new Error(`The RPC segment "${segment}" is invalid...`)

  return segment
}

export const resolveSegments = (segments: string[], lastArgs: unknown[] | null): string[] => {
  if (lastArgs === null) return segments

  const [arg, ..._options]: unknown[] = lastArgs
  return [...segments, assertSafeSegment(String(arg))]
}

/**
 * @param options.maxRetries Must be a non-negative integer if it is a number.
 * @param options.timeoutMs Must be a non-negative integer if it is a number.
 * @param options.intervalMs Must be a non-negative integer if it is a number.
 */
export const sendRequest = async ({
  basePath,
  path,
  input,
  method,
  headers,
  timeoutMs,
  intervalMs,
  maxRetries = MAX_RETRIES,
  idempotent,
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

    if (signal) cleanups.push(forwardAbort(controller, signal))

    const clearTimer: () => void = scheduleAbort({
      controller,
      timeoutMs,
      message: `The RPC "${path}" timed out after ${timeoutMs}ms in the ${method} method...`
    })

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
      clearTimer()
      for (const cleanup of cleanups) cleanup()
    }

    const willRetry: boolean = shouldRetry({
      error,
      attempt,
      maxRetries,
      isIdempotent: isIdempotentMethod(method) || idempotent === true,
      signal
    })

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
      const rpcError: RpcError<Routing.Status.Name | Rpc.TransportCode> = await toRpcError(error)

      if (error instanceof Response && rpcError.denied) {
        const denial: Routing.Denial = {
          code: error.status as Routing.Status.DenialCode,
          ...(rpcError.redirect ? { redirect: rpcError.redirect } : {})
        }

        onDeny ? onDeny(denial) : showStatus(denial.code)
      }

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

const toRpcError = async (
  error: unknown
): Promise<RpcError<Routing.Status.Name | Rpc.TransportCode>> => {
  if (error instanceof RpcError) return error

  if (error instanceof Response) {
    let message: string | undefined,
      denied: boolean = error.headers.get(DENIED_HEADER) === '1',
      redirect: string | undefined = error.headers.get(REDIRECT_HEADER) ?? undefined

    try {
      const clonedError: unknown = await error.clone().json()
      if (isObject(clonedError) && 'error' in clonedError) {
        const { error: errorInit } = clonedError as { error: Partial<Rpc.ErrorInit> }

        if (isObject(errorInit)) {
          if (errorInit.denied === true) denied = true

          if (
            redirect === undefined &&
            typeof errorInit.redirect === 'string' &&
            !isBlankString(errorInit.redirect)
          )
            redirect = errorInit.redirect
          if (typeof errorInit.message === 'string') message = errorInit.message
        }
      }
    } catch {
      /** @remarks Headers of non-JSON or HEAD responses already include denials and redirects. */
    }

    return new RpcError({
      code: codeByStatus[error.status] ?? 'INTERNAL_SERVER_ERROR',
      message:
        (!denied && message) ||
        `The RPC request ${denied ? 'was denied' : 'failed'} with status ${error.status}...`,
      denied,
      redirect
    })
  }

  const name: string | undefined = isClientTermination(error)
    ? (error as DOMException).name
    : undefined

  return new RpcError<Rpc.TransportCode>({
    code: name === 'AbortError' ? 'ABORTED' : name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK',
    message: error instanceof Error ? error.message : String(error),
    expose: false
  })
}
