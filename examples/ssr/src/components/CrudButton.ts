import { fics } from 'ficsjs'
import Button from '@/components/materials/Button'

interface Props {
  id: number
  method: 'put' | 'patch' | 'delete'
  deleteMethod: (id: number) => void
  updateMethod: (
    { id, name }: { id: number; name: string },
    method: Exclude<Props['method'], 'delete'>
  ) => void
}

const button = Button()

export default () =>
  fics<{}, Props>({
    name: 'crud-button',
    props: [
      {
        descendant: button,
        values: ({ props: { id, method, deleteMethod, updateMethod } }) => ({
          isDisabled: isNaN(id),
          text: method.toUpperCase(),
          click: () => {
            if (!isNaN(id))
              if (method === 'delete') deleteMethod(id)
              else {
                const name = prompt('Please enter a new user name.')
                if (name) updateMethod({ id, name }, method)
              }
          }
        })
      }
    ],
    html: ({ template }) => template`${button}`
  })
