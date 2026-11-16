import { mutationOnly } from 'ficsjs/router/server-only'
import type { User } from '@/domain/user'
import { defineProcedure, parseEmail, parseName, parseRole } from '@/server/rpc'
import { addUser, emailTakenError } from '@/server/users'

export const create = mutationOnly(
  defineProcedure({
    input: ({ name, email, role } = {}): Omit<User, 'id'> => ({
      name: parseName(name),
      email: parseEmail(email),
      role: parseRole(role)
    }),
    handler: async (input): Promise<User> => {
      const user: User | null = addUser(input)

      if (user === null) throw emailTakenError(input.email)
      return user
    }
  })
)
