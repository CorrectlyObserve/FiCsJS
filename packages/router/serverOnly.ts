import { isBrowser } from '../core/helpers/browser'

if (isBrowser()) throw new Error('Please import only its types on the client...')

export type { FiCsServerRouter as FiCsRouter, FiCsServerRpc as FiCsRpc } from './namespaces'
export { createPageHandler } from './pages'
export { initRpc, createRpcHandler, mutationOnly, RpcError } from './rpc'
