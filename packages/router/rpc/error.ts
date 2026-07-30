import type { Rpc } from '../types'

export class RpcError extends Error {
  readonly code: string
  readonly denied: boolean
  readonly expose: boolean
  readonly redirect?: string

  constructor({ code, message, denied, expose, redirect }: Rpc.ErrorInit) {
    super(message)
    this.name = 'RpcError'
    this.code = code.trim().toLowerCase()
    this.denied = denied ?? false
    this.expose = expose ?? true
    this.redirect = redirect
  }
}
