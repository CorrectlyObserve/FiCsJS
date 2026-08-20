import { denialCodes } from './constants'
import type { Routing } from './types'

export const deny = ({ code, redirect }: Partial<Routing.Denial> = {}): Routing.Denial => {
  const codes: Routing.Status.DenialCode[] = Object.values(denialCodes),
    _code: Routing.Status.DenialCode = code ?? denialCodes[redirect ? 'UNAUTHORIZED' : 'FORBIDDEN']

  if (!codes.includes(_code))
    throw new Error(`The middleware denial code ${_code} must be one of ${codes.join(', ')}...`)

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
