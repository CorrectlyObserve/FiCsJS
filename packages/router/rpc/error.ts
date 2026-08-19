import type { Rpc, StatusCodes, TransportCodes } from '../types'

export class RpcError<T extends StatusCodes | TransportCodes = StatusCodes> extends Error {
  readonly code: StatusCodes | TransportCodes
  readonly denied: boolean
  readonly expose: boolean
  readonly redirect?: string

  constructor({ code, message, denied, expose, redirect }: Rpc.ErrorInit<NoInfer<T>>) {
    super(message)
    this.name = 'RpcError'
    this.code = code
    this.denied = denied ?? false
    this.expose = expose ?? true
    this.redirect = redirect
  }
}
