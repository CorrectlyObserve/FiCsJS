import { fics } from 'ficsjs'

interface Props {
  id: number
  method: 'put' | 'patch' | 'delete'
  deleteMethod: (id: number) => void
  updateMethod: ({ id, name }: { id: number; name: string }, method: 'put' | 'patch') => void
}

export default () =>
  fics<{ isId: (id: number) => boolean }, Props>({
    name: 'button',
    data: () => ({ isId: (id: number) => !isNaN(id) }),
    html: ({ data: { isId }, props: { id, method }, template }) =>
      template`<button aria-disabled="${!isId(id)}">${method.toUpperCase()}</button>`,
    css: { 'button[aria-disabled="true"]': { cursor: 'not-allowed' } },
    actions: {
      button: {
        click: [
          ({ data: { isId }, props: { id, method, deleteMethod, updateMethod } }) => {
            if (isId(id))
              if (method === 'delete') deleteMethod(id)
              else {
                const name = prompt('Please enter a new user name.')
                if (name) updateMethod({ id, name }, method)
              }
          },
          { throttle: 500, blur: true }
        ]
      }
    }
  })
