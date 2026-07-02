import { isBrowser } from './../core/helpers/browser'

if (isBrowser()) throw new Error('Please import only its types on the client...')

export { registerPages } from './host'
export { initRpc, createRpcHandler, mutationOnly, RpcError } from './rpc'
export type { Routing, Rpc } from './types'
