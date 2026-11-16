import type { FiCsRouter } from 'ficsjs/router/server-only'
import { getStatusPage } from '@/domain/status'
import StatusError from '@/pages/StatusError'

export const meta = ({ status }: { status: FiCsRouter.Status }) => {
  const { title, description } = getStatusPage(status)

  return { title: `${status} \u2013 ${title}`, description }
}

export default ({ status, error }: { status: FiCsRouter.Status; error?: unknown }): string =>
  StatusError.toString({
    data: {
      status,
      message: error === undefined ? '' : error instanceof Error ? error.message : String(error)
    }
  })
