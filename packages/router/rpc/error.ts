import { Rpc } from './../types'

export class RpcError extends Error {
  readonly code: string
  readonly status?: number
  readonly expose: boolean

  constructor({ code, message, expose }: Rpc.ErrorInit) {
    super(message)
    this.name = 'RpcError'
    this.code = code
    this.status = status
    this.expose = expose ?? true
  }
}
