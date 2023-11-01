import { html, wely } from './wely'
import cssUrl from './style.css?inline'

const child = wely({
  name: 'child',
  data: () => ({
    count: 1,
    fontSize: 16,
    message: 'Hello',
    back: 'black',
    arr: [1, 2, 3],
    obj: { key: 'value' },
    number: () => 3
  }),
  isOnlyCsr: true,
  html: ({
    data: { message },
    props: { color }
  }: {
    data: { message: string }
    props: { color: string; click: (message: string) => void }
  }) =>
    html`<div><p class="hello" style="display: inline">${message}</p></div>
      <p>${color}</p>`,
  css: [
    cssUrl,
    {
      selector: 'p',
      style: ({ data: { fontSize } }) => ({ fontSize: `${fontSize}px`, cursor: 'pointer' })
    }
  ],
  events: [
    { handler: 'click', method: ({ data: { count } }) => console.log(count++) },
    {
      selector: 'div',
      handler: 'click',
      method: ({ data: { message }, props: { click } }) => click(message)
    }
  ]
})

const child2 = child.overwrite(() => ({ message: 'Good bye!' }))

const parent = wely({
  name: 'parent',
  className: 'test',
  data: () => ({ color: 'blue', click: (message: string) => console.log(message) }),
  props: [{ descendants: child2, props: ({ color, click }) => ({ color, click }) }],
  html: ({ props: { propsColor } }: { props: { propsColor: string } }) =>
    html`${child2}
      <p>propsColor: ${propsColor}</p>`
})

const grandParent = wely({
  name: 'grandParent',
  data: () => ({ color: 'green', fontSize: 24, number: 12 }),
  props: [
    { descendants: [child, child2], props: ({ color }) => ({ color }) },
    { descendants: parent, props: ({ color }) => ({ propsColor: color }) }
  ],
  html: ({ data: { number } }) =>
    html`${parent}
      <p>人数: ${number}</p>`
})

console.log(grandParent.ssr())
grandParent.define()
