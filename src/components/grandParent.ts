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
        <slot name="test"></slot>
        <p>Content is...${email}</p>
        ${parent}
        <p>人数: ${number}</p>
        <input value="${fontSize}" />
      `,
    css: [{ slot: 'test', selector: 'h2', style: { color: 'red' } }],
    slots: [{ name: 'test', html: ({ data: { email }, template }) => template`<h2>${email}</h2>` }],
    actions: [{ handler: 'click', method: ({ setData }) => setData('color', 'red') }]
  })

export default GrandParent
