import { isBrowser } from '../core/helpers/browser'

if (isBrowser()) throw new Error('Please import only its types on the client...')

export type { FiCsPage, FiCsRpcServer as FiCsRpc } from './namespaces'
export { createPageHandler } from './pages'
export { initRpc, createRpcHandler, mutationOnly, RpcError } from './rpc'
