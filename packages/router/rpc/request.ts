import { isObject } from '../../core/helpers'
import type { Rpc } from './../types'
import { RpcError } from './error'

const toRpcError = async (error: unknown): Promise<RpcError> => {
  if (error instanceof RpcError) return error

  if (error instanceof Response) {
    let code: string = 'HTTP_ERROR',
      message: string = `The RPC request failed with status ${error.status}...`

    try {
      const data: unknown = await error.clone().json()
      if (isObject(data) && 'error' in data) {
        const { error } = data as { error: Rpc.ErrorInit }
        if (isObject(error)) {
          if (typeof error.code === 'string') code = error.code
          if (typeof error.message === 'string') message = error.message
        }
      }
    } catch {
      /** @remarks safely falls back to the generic HTTP_ERROR for non-JSON responses. */
    }

    return new RpcError({ code, message })
  }

  const isIntentional: boolean = error instanceof DOMException && error.name === 'AbortError'
  return new RpcError({
    code: isIntentional ? 'ABORTED' : 'NETWORK',
    message: error instanceof Error ? error.message : String(error),
    expose: false
  })
}
