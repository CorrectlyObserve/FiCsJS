import { html, slot, wely } from './packages/core/wely'
import { child2, Parent } from './parent'

const parent = Parent()

const GrandParent = (color: string) =>
  wely({
    name: 'grandParent',
    data: () => ({ color, fontSize: 24, number: 12, email: '' }),
    props: [
      {
        descendants: child2,
        values: getData => ({ color: getData('color') })
      },
      {
        descendants: parent,
        values: getData => ({ propsColor: getData('color') + '2' })
      }
    ],
    html: html` <p>Content is...</p>
      ${slot()}`,
    slot: [
      ({ data: { fontSize, number } }) => html`${parent}
        <p>人数: ${number}</p>
        <input value="${fontSize}" />`,
      {
        name: 'test',
        contents: html`${parent}`
      }
    ],
    events: [
      {
        handler: 'click',
        method: ({ setData }) => setData('color', 'red')
      }
    ]
  })

export default GrandParent
