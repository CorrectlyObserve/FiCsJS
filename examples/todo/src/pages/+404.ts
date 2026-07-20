import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/+spa.config'

const notFound: FiCsRouter.Page<Data> = ({ children: { notFound } }) => notFound

export default notFound
