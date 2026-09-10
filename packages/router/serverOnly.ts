import { isBrowser } from '../core/helpers/browser'

if (isBrowser()) throw new Error('Use "import type" on the client as this module is server-only...')

export type { FiCsServerRouter as FiCsRouter, FiCsServerRpc as FiCsRpc } from './namespaces'
export { createPageHandler, createSpaPage } from './pages'
export { initRpc, createRpcHandler, mutationOnly, RpcError } from './rpc'
