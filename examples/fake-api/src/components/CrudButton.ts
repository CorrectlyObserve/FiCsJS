import { fics } from 'ficsjs'

interface Props {
  userId: string
  method: 'put' | 'patch' | 'delete'
  deleteUser: (userId: string) => void
  updateUser: ({ userId, name }: { userId: string; name: string }, method: 'put' | 'patch') => void
}

export default () =>
  fics<{}, Props>({
    name: 'button',
    html: ({ props: { userId, method }, template }) =>
      template`<button aria-disabled="${userId === ''}">${method.toUpperCase()}</button>`,
    css: { '&[aria-disabled="true"]': { cursor: 'not-allowed' } },
    actions: {
      button: {
        click: [
          ({ props: { userId, method, deleteUser, updateUser } }) => {
            if (userId !== '') {
              if (method === 'delete') deleteUser(userId)
              else {
                const name = prompt('Please enter a new user name.')
                if (name) updateUser({ userId, name }, method)
              }
            }
          },
          { throttle: 500, blur: true }
        ]
      }
    }
  })
