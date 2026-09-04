import { mutationOnly } from 'ficsjs/router/server-only'
import { normalizeEmail } from '@/domain/email'
import type { User } from '@/domain/user'
import { requireUser } from '@/server/auth'
import { defineProcedure, parseId, rpcError } from '@/server/rpc'
import { addUser, nonExistentUserError, removeUser } from '@/server/users'

export const create = mutationOnly(
  defineProcedure({
    input: ({ name, email, role } = {}): Omit<User, 'id'> => {
      if (typeof name !== 'string' || name.trim() === '')
        throw rpcError({ code: 'BAD_REQUEST', message: 'A name is required.' })

      if (role !== 'admin' && role !== 'member')
        throw rpcError({ code: 'BAD_REQUEST', message: 'A role must be "admin" or "member".' })

      const normalizedEmail: string | null = normalizeEmail(email)

      if (normalizedEmail === null)
        throw rpcError({ code: 'BAD_REQUEST', message: 'A valid email is required.' })

      return { name: name.trim(), email: normalizedEmail, role }
    },
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
          message: 'You cannot delete the account you are logged in as.'
        })

      if (!removeUser(id)) throw nonExistentUserError(id)
    }
  })
)
