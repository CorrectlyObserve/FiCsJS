import { numberError } from '../core/helpers'
import { statusCodes } from './constants'
import type { Routing } from './types'

const { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = statusCodes

export const deny = ({ code, redirect }: Partial<Routing.Denial> = {}): Routing.Denial => {
  const _code: number = code ?? (redirect ? UNAUTHORIZED : FORBIDDEN)

  numberError({ 'middleware denial code': _code }, 'int')

  if (_code < BAD_REQUEST || _code >= INTERNAL_SERVER_ERROR)
    throw new Error(`The middleware denial code ${_code} must be an HTTP 4xx status code...`)

  return { code: _code, ...(redirect ? { redirect } : {}) }
}

export const resolveMiddlewares = async <C>(
  mws: readonly Routing.Middleware<C>[],
  ctx: Routing.MiddlewareCtx<C>
): Promise<Routing.Denial | undefined> => {
  for (const mw of mws) {
    const result: void | Routing.Denial = await mw(ctx)
    if (result !== undefined) return result
  }

  return undefined
}
