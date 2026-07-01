import { statusCodes } from './../constants'
import { Rpc } from './../types'

export class RpcError extends Error {
  readonly code: string
  readonly status?: number
  readonly expose: boolean

  constructor({ code, message, expose }: Rpc.ErrorInit) {
    super(message)
    this.name = 'RpcError'
    this.code = code.toLocaleLowerCase()
    this.status =
      this.code in statusCodes ? statusCodes[this.code as keyof typeof statusCodes] : undefined
    this.expose = expose ?? true
  }
}
