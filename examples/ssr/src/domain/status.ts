import { pages, paths } from '@/domain/path'

export interface StatusPage {
  title: string
  description: string
  href: string
  text: string
}

export const NOT_FOUND_STATUS = 404 as const
export const UNAUTHORIZED_STATUS = 401 as const

const texts: Partial<Record<number, Pick<StatusPage, 'title' | 'description'>>> = {
  [UNAUTHORIZED_STATUS]: {
    title: 'Unauthorized',
    description: 'Your session is invalid or the account no longer exists.'
  },
  403: {
    title: 'Forbidden',
    description: 'You have insufficient permissions to access this resource.'
  },
  [NOT_FOUND_STATUS]: {
    title: 'Not Found',
    description: 'The page you requested could not be found.'
  },
  409: { title: 'Conflict', description: 'The request conflicts with an existing record.' },
  500: { title: 'Internal Server Error', description: 'Something went wrong on the server.' }
}

export const getStatusPage = (status: number): StatusPage => ({
  ...(texts[status] ?? { title: 'Error', description: 'The request could not be completed.' }),
  ...(status === UNAUTHORIZED_STATUS
    ? { href: paths.LOGIN, text: 'Log in as someone else \u2192' }
    : status === NOT_FOUND_STATUS
      ? { href: pages.HOME.href, text: `\u2190 Back to ${pages.HOME.name}` }
      : { href: pages.USERS.href, text: `\u2190 Back to ${pages.USERS.name}` })
})
