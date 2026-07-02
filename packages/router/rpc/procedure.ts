import type { Rpc } from './../types'
import { RpcError } from './error'
import { isBodiless } from './helpers'

export const initRpc = <C = unknown>() => ({
  defineProcedure: <I, O>(procedure: Rpc.Procedure<I, O, C>): Rpc.ValidatedProcedure<I, O, C> =>
    procedure as unknown as Rpc.ValidatedProcedure<I, O, C>
})

export const mutationOnly = <I, O, C>(
  procedure: Rpc.Procedure<I, O, C>
): Rpc.Procedure<I, O, C> => ({
  ...procedure,
  handler: (input: I, ctx: Rpc.Ctx<C>) => {
    if (isBodiless(ctx.req.method))
      throw new RpcError({
        code: 'METHOD_NOT_ALLOWED',
        message: 'This procedure does not accept GET or HEAD requests...'
      })

    return procedure.handler(input, ctx)
  }
})
