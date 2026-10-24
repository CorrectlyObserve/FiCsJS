import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/users/+spa'

export const meta = { title: 'User', description: 'View a single user.' }

const page: FiCsRouter.Page<Data> = ({
  data: { selectedUser, isAdmin, notice },
  children: { userDetail }
}) =>
  userDetail.setIndividualProps(selectedUser?.id ?? 'loading', {
    user: selectedUser,
    isAdmin,
    notice
  })

export default page
