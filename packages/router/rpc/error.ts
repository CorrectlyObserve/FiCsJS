import type { Rpc } from '../types'

export class RpcError extends Error {
  readonly code: string | number
  readonly expose: boolean
  readonly redirect?: string

  constructor({ code, message, expose, redirect }: Rpc.ErrorInit) {
    super(message)
    this.name = 'RpcError'
    this.code = typeof code === 'number' ? code : code.trim().toLowerCase()
    this.expose = expose ?? true
    this.redirect = redirect
  }
}
