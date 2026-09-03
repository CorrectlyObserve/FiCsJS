import type { FiCsRouter } from 'ficsjs/router'

export const meta = { title: 'Add', description: 'Add a new user.' }

const page: FiCsRouter.Page<{}> = ({ children: { addUser } }) => addUser

export default page
