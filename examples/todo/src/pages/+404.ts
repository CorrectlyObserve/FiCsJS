import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/+spa'

const notFound: FiCsRouter.Page<Data> = ({ children: { NotFound } }) => NotFound

export default notFound
