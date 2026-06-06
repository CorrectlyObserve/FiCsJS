import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/components/Router'

const notFound: FiCsRouter.Page<Data> = ({ children: { notFound } }) => notFound

export default notFound
