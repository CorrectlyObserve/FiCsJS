import { getStatusPage, NOT_FOUND_STATUS } from '@/domain/status'
import StatusError from '@/pages/StatusError'

const { title, description } = getStatusPage(NOT_FOUND_STATUS)

export const meta = { title: `${NOT_FOUND_STATUS} \u2013 ${title}`, description }

export const prerender = true

export default (): string => StatusError.toString({ data: { status: NOT_FOUND_STATUS } })
