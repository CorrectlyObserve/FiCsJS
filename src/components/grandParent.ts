import fics from '../packages/core/fics'
import { ChildType } from './child'
import { ParentType } from './parent'

const GrandParent = (color: string, child: ChildType, parent: ParentType) =>
  fics({
    name: 'grandParent',
    data: () => ({ color, fontSize: 24, number: 12, email: '' }),
    inheritances: [
      {
        descendants: child,
        values: getData => ({ color: getData('color') })
      },
      {
        descendants: parent,
        values: getData => ({ propsColor: getData('color') + '2' })
      }
    ],
    html: ({ data: { fontSize, number }, template }) => template`<p>Content is...</p>
      ${parent}
      <p>人数: ${number}</p>
      <input value="${fontSize}" />`,
    actions: [{ handler: 'click', method: ({ setData }) => setData('color', 'red') }]
  })

export default GrandParent
