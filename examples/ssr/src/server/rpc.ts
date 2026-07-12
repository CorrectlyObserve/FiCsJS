import { initRpc, RpcError, type FiCsRpc } from 'ficsjs/router/server-only'

export const { defineProcedure } = initRpc<{ actor: string; requestId: string }>()
export const rpcError = (init: FiCsRpc.ErrorInit): RpcError => new RpcError(init)
