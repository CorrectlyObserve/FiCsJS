import { numberError } from '../core/helpers'
import { statusCodes } from './constants'
import type { Routing } from './types'

const { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = statusCodes

export const deny = ({ redirect }: { redirect?: string }): Routing.Denial => {
  const status: number = redirect ? UNAUTHORIZED : FORBIDDEN,
    code: string = 'middleware denial code'

  numberError({ [code]: status }, 'int')

  if (status < BAD_REQUEST || status >= INTERNAL_SERVER_ERROR)
    throw new Error(`The ${code} ${status} must be an HTTP 4xx status...`)

  return { code: 'DENIED', status, ...(redirect ? { redirect } : {}) }
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
