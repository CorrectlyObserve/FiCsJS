import type { FiCsRouter } from 'ficsjs/router'
import { api } from '@fics/routing/client'
import { USERS_PATH } from '@/domain/path'
import type { User } from '@/domain/user'
import UserDetail from '@/pages/users/UserDetail'
import UserList from '@/pages/users/UserList'
import AddUser from '@/pages/users/new/AddUser'

export interface Data {
  users: readonly User[]
  selected: User | null
  isAdmin: boolean
  notice: string
}

const props: FiCsRouter.Props<Data> = [
  {
    descendants: ({ children: { userList, userDetail } }) => [userList, userDetail],
    values: ({ data: { isAdmin, notice } }) => ({ isAdmin, notice })
  },
  {
    descendants: ({ children: { userList } }) => userList,
    values: ({ data: { users } }) => ({ users })
  },
  {
    descendants: ({ children: { userDetail } }) => userDetail,
    values: ({ data: { selected } }) => ({ user: selected })
  }
]

const load = async (data: Data & { pathname: string }): Promise<void> => {
  data.selected = null
  data.notice = ''

  const segment = data.pathname.split('/')[2] ?? ''
  if (segment === '') {
    try {
      const { users, isAdmin }: { users: readonly User[]; isAdmin: boolean } =
        await api.users.list()

      data.users = users
      data.isAdmin = isAdmin
    } catch {
      data.notice = 'The user list could not be loaded.'
    }
  } else if (segment !== 'new') {
    const id: number = Number(segment)

    try {
      if (!Number.isInteger(id) || id <= 0) throw new RangeError(segment)

      const { user, isAdmin }: { user: User; isAdmin: boolean } = await api.users.get({ id })
      data.selected = user
      data.isAdmin = isAdmin
    } catch {
      data.notice = 'That user could not be loaded.'
    }
  }
}

const hooks: FiCsRouter.Hooks<Data> = {
  created: ({ data }) => {
    if ((window.location.pathname.replace(/\/+$/, '') || '/') === data.pathname) load(data)
  },
  updated: { pathname: ({ data }) => load(data) }
}

const spa: FiCsRouter.Spa<Data> = {
  pathname: USERS_PATH,
  children: [UserList, UserDetail, AddUser],
  data: () => ({ users: [], selected: null, isAdmin: false, notice: '' }),
  props,
  hooks
}

export default spa
