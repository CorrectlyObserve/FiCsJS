import type { FiCsRouter } from 'ficsjs/router/server-only'
import type { User } from '@/domain/user'
import type { Data } from '@/pages/websocket-sse/+spa'
import { requireUser } from '@/server/guards'
import { getMessages } from '@/server/messages'

const initialData: FiCsRouter.SpaInitialData<Data> = async ctx => {
  const { name }: User = await requireUser(ctx)
  return { userName: name, messages: [...getMessages()] }
}

export default initialData
