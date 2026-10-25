import type { FiCsRouter } from 'ficsjs/router/server-only'
import { paths } from '@/domain/path'
import { readRedirect, toSafePath, viaLogin } from '@/domain/redirect'
import { isAdmin } from '@/domain/role'
import type { User } from '@/domain/user'
import { readSession, type Session } from '@/server/session'

export const adminOnly = async (ctx: FiCsRouter.MiddlewareCtx) => {
  const { role }: User = await requireUser(ctx)
  if (!isAdmin(role)) return ctx.deny()
}

export const guestOnly = async (ctx: FiCsRouter.MiddlewareCtx) => {
  const { account }: Session = readSession(ctx)
  if (!account) return

  return ctx.deny({ redirect: readRedirect(ctx.req.url) ?? paths.HOME })
}

export const requireUser = async (ctx: { req: Request }): Promise<User> => {
  const { account }: Session = readSession(ctx)
  if (!account)
    throw new Error(
      'Ensure a signedIn guard is applied first, as the current session is unauthenticated.'
    )

  return account
}

export const signedIn = async (ctx: FiCsRouter.MiddlewareCtx) => {
  const { account, isStale }: Session = readSession(ctx)
  if (account) return
  if (isStale) return ctx.deny({ code: 401 })

  const { pathname, search }: URL = new URL(ctx.req.url)
  return ctx.deny({
    redirect: viaLogin(
      ctx.req.headers.get('sec-fetch-dest') === 'document'
        ? toSafePath(`${pathname}${search}`)
        : null
    )
  })
}
