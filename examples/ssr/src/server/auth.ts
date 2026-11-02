import { paths } from '@/domain/path'
import { readRedirect, viaLogin } from '@/domain/redirect'
import { isRole } from '@/domain/role'
import type { User } from '@/domain/user'
import { endSession, startSession } from '@/server/session'
import { getUsers } from '@/server/users'

const MISSING_USER_ID = 0 as const

export const authRoutes = new Map<string, (req: Request) => Response | Promise<Response>>([
  [
    paths.LOGIN,
    async (req: Request): Promise<Response> => {
      const form: FormData = await req.formData().catch(() => new FormData())
      const role: string = String(form.get('role') ?? '')
      const account: User | undefined = isRole(role)
        ? getUsers().find(({ role: r }) => r === role)
        : undefined

      const next: string | null = readRedirect(req.url)
      return account
        ? redirect(next ?? paths.HOME, startSession(req, account.id))
        : redirect(viaLogin(next))
    }
  ],
  [paths.LOGOUT, (req: Request): Response => redirect(viaLogin(null), endSession(req))],
  [
    paths.BREAK_SESSION,
    (req: Request): Response => redirect(paths.HOME, startSession(req, MISSING_USER_ID))
  ]
])

export const redirect = (location: string, cookie?: string): Response =>
  new Response(null, {
    status: 302,
    headers: { location, 'cache-control': 'no-store', ...(cookie ? { 'set-cookie': cookie } : {}) }
  })