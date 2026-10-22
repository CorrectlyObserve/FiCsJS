import { mutationOnly } from 'ficsjs/router/server-only'
import type { User } from '@/domain/user'
import { requireUser } from '@/server/auth'
import { defineProcedure, parseEmail, parseId, parseName, parseRole, rpcError } from '@/server/rpc'
import { addUser, nonExistentUserError, removeUser } from '@/server/users'

export const create = mutationOnly(
  defineProcedure({
    input: ({ name, email, role } = {}): Omit<User, 'id'> => ({
      name: parseName(name),
      email: parseEmail(email),
      role: parseRole(role)
    }),
    handler: async (input): Promise<User> => {
      const user: User | null = addUser(input)

      if (user === null)
        throw rpcError({ code: 'CONFLICT', message: `The email ${input.email} is already taken.` })

      return user
    }
  })
)

export const remove = mutationOnly(
  defineProcedure({
    input: parseId,
    handler: async ({ id }, ctx): Promise<void> => {
      const { id: loggedInId }: User = await requireUser(ctx)

      if (loggedInId === id)
        throw rpcError({
          code: 'BAD_REQUEST',
          message: 'The account you are logged in as cannot be deleted.'
        })

      if (!removeUser(id)) throw nonExistentUserError(id)
    }
  })
)
