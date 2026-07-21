import { statusCodes } from '../constants'
import type { Rpc } from '../types'

export class RpcError extends Error {
  readonly code: string
  readonly status?: number
  readonly expose: boolean
  readonly redirect?: string

  constructor({ code, message, expose, redirect }: Rpc.ErrorInit) {
    super(message)
    this.name = 'RpcError'
    this.code = code.toUpperCase()

    this.status =
      this.code in statusCodes ? statusCodes[this.code as keyof typeof statusCodes] : undefined

    this.expose = expose ?? true
    this.redirect = redirect
  }
}
