import { initRpc, RpcError, type FiCsRpc } from 'ficsjs/router/server-only'
import { normalizeEmail } from '@/domain/email'
import { isRole, type Role } from '@/domain/role'

export const { defineProcedure } = initRpc()
export const rpcError = (init: FiCsRpc.ErrorInit): RpcError => new RpcError(init)

const userIdError = (id: unknown): RpcError =>
  rpcError({ code: 'BAD_REQUEST', message: `The user id ${id} must be a positive integer.` })

export const parseId = ({ id }: Record<string, unknown> = {}): { id: number } => {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0)
    throw rpcError({
      code: 'BAD_REQUEST',
      message: `The user id ${id} must be a positive integer.`
    })

  return { id }
}

export const parseName = (name: unknown): string => {
  if (typeof name !== 'string' || name.trim() === '')
    throw rpcError({ code: 'BAD_REQUEST', message: 'The name is required.' })

  return name.trim()
}

export const parseEmail = (email: unknown): string => {
  const normalized: string | null = normalizeEmail(email)
  if (normalized === null)
    throw rpcError({ code: 'BAD_REQUEST', message: 'The email must be a valid address.' })

  return normalized
}

export const parseRole = (role: unknown): Role => {
  if (typeof role !== 'string' || !isRole(role))
    throw rpcError({ code: 'BAD_REQUEST', message: 'The role must be "admin" or "member".' })

  return role
}
