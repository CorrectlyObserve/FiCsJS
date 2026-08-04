import { mutationOnly } from 'ficsjs/router/server-only'
import { defineProcedure, rpcError } from '@/server/rpc'
import { findUser, removeUser, updateUser } from '@/server/users'
import type { User } from '@/types'

const parseId = (raw: string): number => {
  const id: number = Number(raw)
  if (!Number.isInteger(id))
    throw rpcError({ code: 'BAD_REQUEST', message: `The user id ${raw} must be an integer.` })

  return id
}

const notFound = (id: string): never => {
  throw rpcError({ code: 'NOT_FOUND', message: `The user with ID ${id} does not exist.` })
}

export const get = defineProcedure({
  handler: async (_input: void, { dynamicParams: { id } }): Promise<User> =>
    findUser(parseId(id)) ?? notFound(id)
})

export const update = mutationOnly(
  defineProcedure({
    input: (raw = {}): Partial<Omit<User, 'id'>> => {
      const { name, email } = raw as { name?: unknown; email?: unknown },
        patch: Partial<Omit<User, 'id'>> = {}

      if (typeof name === 'string') patch.name = name
      if (typeof email === 'string') patch.email = email
      return patch
    },
    handler: async (input, { dynamicParams: { id } }): Promise<User> => {
      if (input.name?.toLowerCase() === 'expose test')
        throw rpcError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'SECRET ERROR TEXT',
          expose: false
        })

      return updateUser(parseId(id), input) ?? notFound(id)
    }
  })
)

export const remove = mutationOnly(
  defineProcedure({
    handler: async (_input: void, { dynamicParams: { id } }): Promise<void> => {
      if (!removeUser(parseId(id))) notFound(id)
    }
  })
)
