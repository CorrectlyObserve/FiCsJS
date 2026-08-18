import type { FiCsRouter } from 'ficsjs/router/server-only'
import { findUser } from '@/server/users'

const middleware: FiCsRouter.Middleware = async ({ dynamicParams: { id }, deny }) => {
  if (!findUser(Number(id))) return deny({ code: 404 })
}

export default middleware
