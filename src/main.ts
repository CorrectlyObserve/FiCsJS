import { html, slot, wely } from './wely'
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
  className: ({ data: { back } }) => back,
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
    {
      handler: 'click',
      method: ({ data }) => {
        data.count++
        console.log(data.count)
      }
    },
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
  data: () => ({
    color: 'blue',
    click: (message: string) => console.log(message)
  }),
  props: [
    {
      descendants: child2,
      values: ({ color, click }) => ({ color, click })
    }
  ],
  className: 'test',
  html: ({ props: { propsColor } }: { props: { propsColor: string } }) =>
    html`${child2}
      <p>propsColor: ${propsColor}</p>`
})

const grandParent = wely({
  name: 'grandParent',
  data: () => ({ color: 'green', fontSize: 24, number: 12 }),
  props: [
    {
      descendants: [child, child2],
      values: ({ color }) => ({ color })
    },
    {
      descendants: parent,
      values: ({ color }) => ({ propsColor: color })
    }
  ],
  html: html` <p>Content is...</p>
    ${slot()}`,
  // slot: ({ data: { fontSize, number } }) =>
  //   html`${parent}
  //     <p>人数: ${number}</p>
  //     <input value="${fontSize}" />`
  slot: [
    ({ data: { fontSize, number } }) =>
      html`${parent}
        <p>人数: ${number}</p>
        <input value="${fontSize}" />`,
    {
      name: 'test',
      contents: html`${parent}`
    }
  ]
})

console.log(grandParent.ssr())

grandParent.define()
