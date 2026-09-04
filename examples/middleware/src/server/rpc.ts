import { initRpc, RpcError, type FiCsRpc } from 'ficsjs/router/server-only'

export const { defineProcedure } = initRpc()
export const rpcError = (init: FiCsRpc.ErrorInit): RpcError => new RpcError(init)

export const parseId = ({ id }: Record<string, unknown> = {}): { id: number } => {
  if (typeof id !== 'number' || !Number.isInteger(id))
    throw rpcError({ code: 'BAD_REQUEST', message: 'An integer id is required.' })

  return { id }
}
