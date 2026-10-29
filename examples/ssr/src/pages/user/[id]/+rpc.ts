import { mutationOnly } from 'ficsjs/router/server-only'
import type { User } from '@/domain/user'
import {
  defineProcedure,
  parseEmail,
  parseIdParam,
  parseName,
  parseRole,
  rpcError
} from '@/server/rpc'
import { emailTakenError, findUser, nonExistentUserError, updateUser } from '@/server/users'

export const update = mutationOnly(
  defineProcedure({
    input: ({ name, email, role } = {}): Partial<Omit<User, 'id'>> => {
      const patch: Partial<Omit<User, 'id'>> = {}

      if (name !== undefined) patch.name = parseName(name)
      if (email !== undefined) patch.email = parseEmail(email)
      if (role !== undefined) patch.role = parseRole(role)

      return patch
    },
    handler: async (patch, { dynamicParams: { id } }): Promise<User> => {
      const userId: number = parseIdParam(id)

      if (patch.name?.toLowerCase() === 'expose test')
        throw rpcError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'SECRET ERROR TEXT',
          expose: false
        })

      const owner: User | undefined = patch.email ? findUser(patch.email) : undefined
      if (owner && owner.id !== userId) throw emailTakenError(owner.email)

      const user: User | null = updateUser(userId, patch)
      if (!user) throw nonExistentUserError(userId)

      return user
    }
  })
)
