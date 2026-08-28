import type { FiCsRouter } from 'ficsjs/router/server-only'
import type { User } from '@/domain/user'
import { findUser } from '@/server/users'

export interface Session {
  account: User | null
  isStale: boolean
}

export const SESSION_COOKIE = 'fics_session' as const

const cache = new WeakMap<Request, Promise<Session>>()
const readSession = ({ req }: { req: Request }): Promise<Session> => {
  let session = cache.get(req)

  if (!session) {
    session = (async () => {
      const header = req.headers.get('cookie') ?? ''
      const target = header
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(`${SESSION_COOKIE}=`))
      const id = target ? decodeURIComponent(target.substring(SESSION_COOKIE.length + 1)) : null

      if (!id) return { account: null, isStale: false }

      const account = findUser(Number(id)) ?? null
      return { account, isStale: !account }
    })().catch(error => {
      cache.delete(req)
      throw error
    })

    cache.set(req, session)
  }

  return session
}

export const requireUser = async (ctx: { req: Request }): Promise<User> => {
  const { account }: Session = await readSession(ctx)
  if (!account)
    throw new Error(
      'Please ensure a signedIn guard is applied first as the current session is unauthenticated.'
    )

  return account
}

export const signedIn = async (ctx: FiCsRouter.MiddlewareCtx) => {
  const { account, isStale }: Session = await readSession(ctx)
  if (account) return

  return ctx.deny(isStale ? { code: 401 } : { redirect: '/login' })
}
