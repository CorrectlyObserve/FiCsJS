import { mutationOnly } from 'ficsjs/router/server-only'
import { isAdmin } from '@/domain/role'
import type { User } from '@/domain/user'
import { requireUser } from '@/server/guards'
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
    handler: async (patch, ctx): Promise<User> => {
      const userId: number = parseIdParam(ctx.dynamicParams.id)
      const wantsToChangeRole: boolean = patch.role !== undefined

      if (wantsToChangeRole && !isAdmin((await requireUser(ctx)).role))
        throw rpcError({ code: 'FORBIDDEN', message: 'Only an admin can change a role.' })

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
