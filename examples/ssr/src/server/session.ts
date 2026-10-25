import type { User } from '@/domain/user'
import { findUser } from '@/server/users'

export interface Session {
  account: User | null
  isStale: boolean
}

const SESSION_COOKIE = 'fics_session' as const
const SESSION_MAX_AGE: number = 60 * 60 * 24 * 7

const sessions: Map<string, { userId: number; expiresAt: number }> = new Map()

const readSessionId = (req: Request): string | null =>
  (req.headers.get('cookie') ?? '')
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1) || null

const dropSession = (req: Request): void => {
  const id: string | null = readSessionId(req)
  if (id) sessions.delete(id)
}

const toSetCookie = ({
  req: { url },
  value,
  maxAge
}: {
  req: Request
  value: string
  maxAge: number
}): string =>
  [
    `${SESSION_COOKIE}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    ...(new URL(url).protocol === 'https:' ? ['Secure'] : [])
  ].join('; ')

export const readSession = ({ req }: { req: Request }): Session => {
  const id: string | null = readSessionId(req),
    session = id ? sessions.get(id) : undefined

  if (!session || session.expiresAt <= Date.now()) {
    if (id) sessions.delete(id)
    return { account: null, isStale: false }
  }

  const account: User | null = findUser(session.userId) ?? null
  return { account, isStale: !account }
}

export const startSession = (req: Request, userId: number): string => {
  dropSession(req)

  const id: string = crypto.randomUUID()
  sessions.set(id, { userId, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 })

  return toSetCookie({ req, value: id, maxAge: SESSION_MAX_AGE })
}

export const endSession = (req: Request): string => {
  dropSession(req)
  return toSetCookie({ req, value: '', maxAge: 0 })
}

export const getSessionUser = (req: Request): User | null => readSession({ req }).account
