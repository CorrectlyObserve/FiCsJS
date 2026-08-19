import { mutationOnly } from 'ficsjs/router/server-only'
import { defineProcedure, rpcError } from '@/server/rpc'
import { addUser, type User } from '@/server/users'

export const create = mutationOnly(
  defineProcedure({
    input: ({ name, email } = {}): Omit<User, 'id'> => {
      if (typeof name !== 'string' || name.trim() === '')
        throw rpcError({ code: 'BAD_REQUEST', message: 'A name is required.' })

      if (typeof email !== 'string')
        throw rpcError({ code: 'BAD_REQUEST', message: 'An email must be a string.' })

      return { name, email }
    },
    handler: async (input): Promise<User> => addUser(input)
  })
)
