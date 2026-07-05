import { statusCodes } from './../constants'
import type { Rpc } from './../types'
import {
  APPLICATION_JSON,
  CONTENT_TYPE,
  CONTENT_LENGTH,
  DEFAULT_ERRORS,
  metricReasons
} from './constants'
import { getByteLength, isHeadMethod } from './helpers'
import { emitMetric } from './metric'
import { RpcError } from './error'

export const errorRes = <C = unknown>({
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

  if (error instanceof RpcError) {
    const { code, message, expose }: RpcError = error
    return res({ code, error: expose ? message : true })
  }

  onError?.(error, { path, req })

  if (stage === 'handle') return res({ code: 'INTERNAL_SERVER_ERROR', error: true })

  return res({
    code: 'BAD_REQUEST',
    error: 'The provided request input does not match the expected format...'
  })
}

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
  return res({ code, error })
}

export const response = ({
  body,
  error,
  code,
  cacheHeaders,
  method
}: {
  code: string
  cacheHeaders?: HeadersInit
  method?: Rpc.Method | string
} & ({ body?: unknown; error?: never } | { body?: never; error: string | true })): Response => {
  code = code.toUpperCase()
  if (!(code in statusCodes))
    throw new Error(`The status code ${code} is not a valid HTTP status code...`)

  const statusCode = code as keyof typeof statusCodes,
    payload: unknown = error
      ? { error: { code, message: error === true ? DEFAULT_ERRORS[statusCode] : error } }
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

  return new Response(_isHeadMethod ? null : serialized, {
    status: statusCodes[statusCode],
    headers
  })
}
