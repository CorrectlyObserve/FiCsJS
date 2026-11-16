import type { Routing, Rpc } from '../types'

export class RpcError<
  T extends Routing.Status.Name | Rpc.TransportCode = Routing.Status.Name
> extends Error {
  readonly code: Routing.Status.Name | Rpc.TransportCode
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
