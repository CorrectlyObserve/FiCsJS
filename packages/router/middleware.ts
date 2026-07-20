import { numberError } from '../core/helpers'
import type { Routing } from './types'

export const deny = ({ code, redirect }: Routing.Options.Deny = {}): Routing.Deny => {
  const _code: number = code ?? (redirect ? 401 : 403),
    codeName: string = 'middleware denial code'

  numberError({ [codeName]: _code }, 'int')

  if (_code < 400 || _code >= 500)
    throw new Error(`The ${codeName} ${_code} must be an HTTP 4xx status...`)

  return { code: _code, ...(redirect ? { redirect } : {}) }
}

export const resolveMiddlewares = async <C>(
  mws: readonly Routing.Middleware<C>[],
  ctx: Routing.MiddlewareCtx<C>
): Promise<Routing.Deny | undefined> => {
  for (const mw of mws) {
    const result: void | Routing.Deny = await mw(ctx)
    if (result !== undefined) return result
  }

  return undefined
}
