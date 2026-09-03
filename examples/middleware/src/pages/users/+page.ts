import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/users/+spa.config'

export const meta = { title: 'Users', description: 'Browse the user list.' }

const page: FiCsRouter.Page<Data> = ({ children: { userList } }) => userList

export default page
