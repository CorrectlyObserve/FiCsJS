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
    {
      handler: 'click',
      method: ({ data: { count } }) => console.log(count++)
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
  className: 'test',
  data: () => ({
    color: 'blue',
    click: (message: string) => console.log(message)
  }),
  html: ({ props: { propsColor } }: { props: { propsColor: string } }) =>
    html`${child2}
      <p>propsColor: ${propsColor}</p>`,
  inheritances: [
    {
      descendants: child2,
      props: ({ color, click }) => ({ color, click })
    }
  ]
})

const grandParent = wely({
  name: 'grandParent',
  data: () => ({
    color: 'green',
    fontSize: 24,
    number: 12
  }),
  html: ({ data: { number } }) =>
    html`${parent}
      <p>人数: ${number}</p>`,
  inheritances: [
    { descendants: [child, child2], props: ({ color }) => ({ color }) },
    { descendants: parent, props: ({ color }) => ({ propsColor: color }) }
  ]
})

console.log(grandParent.ssr())
grandParent.define()

wely({
  name: 'Wely2',
  html: {
    contents: [1, 2, 3],
    render: (arg: number, index) => `<p class="class-${index}">${arg * 2}</p>`
  }
}).define()

wely({
  name: 'wely3',
  data: () => ({
    number: 100,
    text: 'AA',
    count: 1
  }),
  html: ({ data: { number } }) => ({
    branches: [
      { judge: number > 100, render: child },
      { judge: number < 100, render: `<p>bbb</p>` }
    ],
    fallback: `<slot />`
  }),
  csrSlot: html`${child}
    <p>AAA</p>`,
  events: [
    {
      handler: 'click',
      selector: 'slot',
      method: ({ data: { number, text } }, e, index) => console.log(number, text, e, index)
    }
  ]
}).define()

wely({
  name: 'Wely4',
  data: () => ({
    numbers: [1, 2, 3]
  }),
  html: ({ data: { numbers } }: { data: { numbers: number[] } }) => ({
    contents: numbers,
    branches: [
      {
        judge: arg => arg === 100,
        render: (arg, index) => `<p class="class-${index}">${arg * 2}</p>`
      },
      {
        judge: arg => typeof arg !== 'number',
        render: (arg, index) => `<p class="class-${index}">${arg}</p>`
      }
    ],
    fallback: arg => `<p class="class-z">${arg * 10}</p>`
  }),
  events: [
    {
      selector: '.class-z',
      handler: 'click',
      method: ({ data: { numbers } }, e, index) => console.log(numbers[index ?? 0], e)
    }
  ]
}).define()
