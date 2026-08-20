import { APPLICATION_JSON, CONTENT_TYPE } from '../../core/helpers'
import { statusCodes } from '../constants'
import { isHeadMethod } from '../helpers'
import type { Routing, Rpc } from '../types'
import {
  CONTENT_LENGTH,
  DEFAULT_ERRORS,
  DENIED_HEADER,
  metricReasons,
  REDIRECT_HEADER
} from './constants'
import { getByteLength } from './helpers'
import { emitMetric } from './metric'
import { RpcError } from './error'

export const reject = <C = unknown>({
  onMetric,
  path,
  code,
  error
}: {
  onMetric: Rpc.Options.Handler<C>['onMetric']
  path: string
  code: keyof typeof metricReasons
  error: string | true
}): Response => {
  emitMetric(onMetric, { type: 'reject', path, reason: metricReasons[code] })
  return respond({ code, error })
}

export const respond = ({
  body,
  error,
  code,
  cacheHeaders,
  method
}: {
  code: Routing.Status.Name
  cacheHeaders?: HeadersInit
  method?: Rpc.Method | string
} & ({ body?: unknown; error?: never } | { body?: never; error: string | true })): Response => {
  const payload: unknown = error
      ? { error: { code, message: error === true ? DEFAULT_ERRORS[code] : error } }
      : body,
    headers: Headers = new Headers(cacheHeaders),
    _isHeadMethod: boolean = isHeadMethod(method ?? 'GET')

  let serialized: string | null = null

  if (payload !== null && payload !== undefined) {
    serialized = JSON.stringify(payload)

    if (!headers.has(CONTENT_TYPE)) headers.set(CONTENT_TYPE, APPLICATION_JSON)

    if (_isHeadMethod && !headers.has(CONTENT_LENGTH))
      headers.set(CONTENT_LENGTH, getByteLength(serialized).toString())
  }

  return new Response(_isHeadMethod ? null : serialized, { status: statusCodes[code], headers })
}

export const respondDenial = ({
  code,
  method,
  redirect
}: Routing.Denial & { method: Rpc.Method }): Response => {
  const headers: Headers = new Headers({ [CONTENT_TYPE]: APPLICATION_JSON, [DENIED_HEADER]: '1' })
  if (redirect) headers.set(REDIRECT_HEADER, redirect)

  /** @remarks The key `error` is for the toRpcError function. */
  const serialized: string = JSON.stringify({
      error: { denied: true, ...(redirect ? { redirect } : {}) }
    }),
    _isHeadMethod: boolean = isHeadMethod(method)

  if (_isHeadMethod) headers.set(CONTENT_LENGTH, getByteLength(serialized).toString())

  return new Response(_isHeadMethod ? null : serialized, { status: code, headers })
}

export const respondError = <C = unknown>({
  error,
  onMetric,
  onError,
  path,
  method,
  startedAt,
  stage,
  req
}: {
  error: unknown
  onMetric: Rpc.Options.Handler<C>['onMetric']
  onError?: Rpc.Options.Handler<C>['onError']
  path: string
  method: Rpc.Method
  startedAt: number
  stage: 'validate' | 'handle'
  req: Request
}): Response => {
  emitMetric(onMetric, {
    type: 'handle:error',
    path,
    method,
    durationMs: performance.now() - startedAt,
    error,
    stage
  })

  /** @remarks Always a status error, as denials are handled in middleware. */
  if (error instanceof RpcError) {
    const { code, message, expose }: RpcError = error

    return respond({
      code: code in statusCodes ? (code as Routing.Status.Name) : 'INTERNAL_SERVER_ERROR',
      error: expose ? message : true
    })
  }

  onError?.(error, { path, req })

  if (stage === 'handle') return respond({ code: 'INTERNAL_SERVER_ERROR', error: true })

  return respond({
    code: 'BAD_REQUEST',
    error: 'The provided request input does not match the expected format...'
  })
}
