import { mutationOnly } from 'ficsjs/router/server-only'
import type { User } from '@/domain/user'
import { requireUser } from '@/server/guards'
import { defineProcedure, parseName } from '@/server/rpc'
import { nonExistentUserError, updateUser } from '@/server/users'

export const rename = mutationOnly(
  defineProcedure({
    input: ({ name } = {}): { name: string } => ({ name: parseName(name) }),
    handler: async ({ name }, ctx): Promise<User> => {
      const { id }: User = await requireUser(ctx)
      const user: User | null = updateUser(id, { name })

      if (!user) throw nonExistentUserError(id)

      return user
    }
  })
)
