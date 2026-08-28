import type { FiCsRouter } from 'ficsjs/router/server-only'
import StatusError from '@/pages/StatusError'

const texts: Partial<Record<FiCsRouter.Status, { title: string; description: string }>> = {
  401: {
    title: 'Unauthorized',
    description: 'Your session is invalid or the account no longer exists.'
  },
  403: {
    title: 'Forbidden',
    description: 'You have insufficient permissions to access this resource.'
  },
  409: { title: 'Conflict', description: 'The request conflicts with an existing record.' },
  500: { title: 'Internal Server Error', description: 'Something went wrong on the server.' }
}

const getStatusText = (status: FiCsRouter.Status): { title: string; description: string } =>
  texts[status] ?? { title: 'Error', description: 'The request could not be completed.' }

export const meta = ({ status }: { status: keyof typeof texts }) => ({
  title: `${status} — ${status in texts ? texts[status].title : 'Error'}`,
  description: description(status)
})

export default ({ status, error }: { status: keyof typeof texts; error?: unknown }): string =>
  StatusError.toString({
    data: {
      description: getStatusText(status).description,
      message: error instanceof Error ? error.message : String(error ?? 'Unknown server error'),
      href: status === 401 ? '/login' : '/users',
      text: status === 401 ? 'Log in as someone else \u2192' : '\u2190 Back to the user list'
    }
  })
