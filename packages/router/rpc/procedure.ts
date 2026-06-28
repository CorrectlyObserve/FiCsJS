import { statusCodes } from '../constants'
import type { Rpc } from '../types'
import { RpcError } from './error'
import { isBodiless } from './helpers'

export const createDefineProcedure =
  <C = unknown>() =>
  <I, O>(procedure: Rpc.Procedure<I, O, C>): Rpc.ValidatedProcedure<I, O, C> =>
    procedure as unknown as Rpc.ValidatedProcedure<I, O, C>

export const mutationOnly = <I, O, C>(
  procedure: Rpc.Procedure<I, O, C>
): Rpc.Procedure<I, O, C> => ({
  ...procedure,
  handler: async (input, ctx) => {
    if (isBodiless(ctx.req.method)) {
      const code = 'METHOD_NOT_ALLOWED' as const
      throw new RpcError({
        code,
        message: 'This procedure does not accept GET or HEAD requests...',
        status: statusCodes[code]
      })
    }

    return procedure.handler(input, ctx)
  }
})
