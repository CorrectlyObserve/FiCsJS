import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/users/+spa'

export const meta = { title: 'User', description: 'View a single user.' }

const page: FiCsRouter.Page<Data> = ({ children: { userDetail } }) => userDetail

export default page
