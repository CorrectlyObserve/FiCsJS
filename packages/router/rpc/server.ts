import {
  APPLICATION_JSON,
  CONTENT_TYPE,
  isObject,
  numberError,
  removeTrailingSlash
} from '../../core/helpers'
import { RPC_BASE_PATH, statusCodes } from '../constants'
import { dynamicPathToRegex, getDynamicPaths } from '../dynamicPaths'
import { hasMethod, isDynamicPath, prependSlash } from '../helpers'
import { deny, resolveMiddlewares } from '../middleware'
import type { Routing, Rpc } from '../types'
import { CONTENT_LENGTH, RESERVED_KEYS, RPC_INPUT_PARAM } from './constants'
import { getByteLength, isBodiless } from './helpers'
import { emitMetric } from './metric'
import { denialResponse, errorResponse, reject, response } from './response'

export const createRpcHandler = <C = unknown>(
  {
    basePath = RPC_BASE_PATH,
    procedures
  }: {
    basePath?: string
    procedures: readonly {
      prefix: string
      module: Record<string, unknown>
      middlewares?: readonly Routing.Middleware<C>[]
    }[]
  },
  { createContext, onError, onMetric, maxBodyBytes }: Rpc.Options.Handler<C>
): ((req: Request) => Promise<Response>) => {
  numberError({ maxBodyBytes }, 'non-negative-int')

  const _basePath: string = removeTrailingSlash(basePath),
    statics: Map<
      string,
      { procedure: Rpc.Procedure; middlewares: readonly Routing.Middleware<C>[] }
    > = new Map(),
    dynamics: {
      pattern: string
      regex: RegExp
      procedure: Rpc.Procedure
      middlewares: readonly Routing.Middleware<C>[]
    }[] = []

  for (const { prefix, module, middlewares = [] } of procedures)
    for (const key of Object.keys(module)) {
      if (
        key === 'default' ||
        RESERVED_KEYS.has(key) ||
        !hasMethod<Rpc.Procedure>(module[key], 'handler')
      )
        continue

      const pattern: string = prefix ? `${prefix}/${key}` : key
      if (statics.has(pattern) || dynamics.some(({ pattern: p }) => p === pattern))
        throw new Error(`The RPC procedure path "${pattern}" already exists...`)

      if (isDynamicPath(pattern))
        dynamics.push({
          pattern,
          regex: dynamicPathToRegex(pattern),
          procedure: module[key]
        })
      else staticMap.set(pattern, module[key])
    }

  return async (req: Request): Promise<Response> => {
    const { method, url, headers, signal }: Request = req,
      /** @remarks Means the OPTIONS request a browser auto-sends before a cross-origin call to check it is allowed. It runs no procedure. */
      isCorsPreflight: boolean = method === 'OPTIONS'

    if (isCorsPreflight) return response({ code: 'NO_CONTENT' })

    let { pathname: path, searchParams }: URL = new URL(url)

    if (_basePath.length > 0 && (path === _basePath || path.startsWith(`${_basePath}/`)))
      path = path.slice(_basePath.length)

    path = removeTrailingSlash(path.replace(/^\/+/, ''))

    let procedure: Rpc.Procedure | undefined = staticMap.get(path),
      dynamicParams: Record<string, string> = {}

    if (!procedure)
      for (const { pattern, regex, procedure: p } of dynamics) {
        const _path: string = prependSlash(path)
        if (regex.test(_path)) {
          procedure = p
          dynamicParams = getDynamicPaths(pattern, _path)
          break
        }
      }

    if (!procedure)
      return reject<C>({
        onMetric,
        path,
        code: 'NOT_FOUND',
        error: `The requested procedure at "${path}" could not be found...`
      })

    let raw: unknown
    try {
      if (isBodiless(method)) {
        const query: string | null = searchParams.get(RPC_INPUT_PARAM)
        if (query !== null) raw = JSON.parse(query)
      } else {
        const contentLength: string | null = headers.get(CONTENT_LENGTH)

        if (maxBodyBytes && contentLength !== null) {
          const declaredLength: number = Number(contentLength)
          if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes)
            return reject<C>({ onMetric, path, code: 'PAYLOAD_TOO_LARGE', error: true })
        }

        const text: string = await req.text()
        if (text) {
          if (!(headers.get(CONTENT_TYPE)?.toLowerCase() ?? '').startsWith(APPLICATION_JSON))
            return reject<C>({
              onMetric,
              path,
              code: 'BAD_REQUEST',
              error: `The request requires a ${CONTENT_TYPE} of ${APPLICATION_JSON}...`
            })

          if (maxBodyBytes && getByteLength(text) > maxBodyBytes)
            return reject<C>({ onMetric, path, code: 'PAYLOAD_TOO_LARGE', error: true })

          raw = JSON.parse(text)
          if (!isObject(raw)) return reject<C>({ onMetric, path, code: 'BAD_REQUEST', error: true })
        }
      }
    } catch {
      return reject<C>({
        onMetric,
        path,
        code: 'BAD_REQUEST',
        error: 'The request body could not be parsed as valid JSON...'
      })
    }

    const startedAt: number = performance.now()
    emitMetric(onMetric, { type: 'handle:start', path, method: method as Rpc.Method })

    if (procedure.input)
      try {
        raw = await procedure.input(raw)
      } catch (error) {
        return errorResponse<C>({
          error,
          onMetric,
          onError,
          path,
          method: method as Rpc.Method,
          startedAt,
          stage: 'validate',
          req
        })
      }

    try {
      const body: unknown = await procedure.handler(raw, {
        ...(await createContext?.(req)),
        req,
        signal,
        dynamicParams
      })

      emitMetric(onMetric, {
        type: 'handle:success',
        path,
        method: method as Rpc.Method,
        durationMs: performance.now() - startedAt
      })

      return response({
        body,
        code: body === undefined ? 'NO_CONTENT' : 'OK',
        cacheHeaders: isBodiless(method) ? { 'cache-control': 'private, no-store' } : undefined,
        method: method as Rpc.Method
      })
    } catch (error) {
      return errorResponse<C>({
        error,
        onMetric,
        onError,
        path,
        method: method as Rpc.Method,
        startedAt,
        stage: 'handle',
        req
      })
    }
  }
}
