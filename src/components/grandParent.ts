import fics from '../packages/core/fics'
import { ChildType } from './child'
import { ParentType } from './parent'

const GrandParent = (color: string, child: ChildType, parent: ParentType) =>
  fics({
    name: 'grandParent',
    data: () => ({ color, fontSize: 24, number: 12, email: 'sss' }),
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
    html: ({ data: { fontSize, number, email }, template }) =>
      template`
        <h2>${email}</h2>
        <p>Content is...${email}</p>
        ${parent}
        <p>人数: ${number}</p>
        <input value="${fontSize}" />
      `,
    css: [{ selector: 'h2', style: { color: 'red' } }],
    actions: [{ handler: 'click', method: ({ setData }) => setData('color', 'red') }]
  })

export default GrandParent
