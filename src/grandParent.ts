import { html, wely } from './packages/core/wely'
import { ChildType } from './child'
import { ParentType } from './parent'

const GrandParent = (color: string, child: ChildType, parent: ParentType) =>
  wely({
    name: 'grandParent',
    data: () => ({ color, fontSize: 24, number: 12, email: '' }),
    props: [
      {
        descendants: child,
        values: getData => ({ color: getData('color') })
      },
      {
        descendants: parent,
        values: getData => ({ propsColor: getData('color') + '2' })
      }
    ],
    html: ({ data: { fontSize, number } }) => html`<p>Content is...</p>
      ${parent}
      <p>人数: ${number}</p>
      <input value="${fontSize}" />`,
    events: [
      {
        handler: 'click',
        method: ({ setData }) => setData('color', 'red')
      }
    ]
  })

export default GrandParent
