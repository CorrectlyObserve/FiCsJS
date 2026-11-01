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
import {
  emailTakenError,
  findUser,
  nonExistentUserError,
  removeUser,
  updateUser
} from '@/server/users'

export const checkUpdateAccess = mutationOnly(
  defineProcedure({ handler: async (): Promise<void> => {} })
)

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

const assertDelete = ({ req: { method } }: { req: Request }): void => {
  if (method !== 'DELETE')
    throw rpcError({
      code: 'METHOD_NOT_ALLOWED',
      message: 'Use the DELETE method for this procedure.'
    })
}

export const checkRemoveAccess = mutationOnly(
  defineProcedure({ handler: async (_, ctx): Promise<void> => assertDelete(ctx) })
)

export const remove = mutationOnly(
  defineProcedure({
    handler: async (_, ctx): Promise<void> => {
      assertDelete(ctx)

      const userId: number = parseIdParam(ctx.dynamicParams.id)

      if ((await requireUser(ctx)).id === userId)
        throw rpcError({
          code: 'BAD_REQUEST',
          message: 'The account you are logged in as cannot be deleted.'
        })

      if (!removeUser(userId)) throw nonExistentUserError(userId)
    }
  })
)
