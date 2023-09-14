import { html, wely } from './wely'
import cssUrl from './style.css?inline'

interface Data {
  count: number
  fontSize: number
  message: string
  back: string
}

interface Props {
  color: string
  click: (message: string) => void
}

const app = document.getElementById('app')!

const child = wely({
  name: 'child',
  data: () => ({
    count: 1,
    fontSize: 16,
    message: 'Hello',
    back: 'black'
  }),
  html: ({ data: { message }, props: { color } }: { data: Data; props: Props }) =>
    `<div><p class="hello" style="display: inline">${message}</p></div><p>${color}</p>`,
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
  dependencies: child,
  slot: html`${child2}
    <p>aaa</p>`,
  html: `<slot />`
})

wely({
  name: 'grandParent',
  dependencies: parent,
  data: () => ({
    color: 'green',
    number: 12,
    click: (message: string) => console.log(message)
  }),
  html: ({ data: { number } }) =>
    html`${parent}
      <p>人数: ${number}</p>`,
  inheritances: [
    {
      descendants: [child, child2],
      props: ({ color, click }) => ({ color, click })
    }
  ]
}).mount(app)

wely({
  name: 'Wely2',
  html: {
    contents: [1, 2, 3],
    render: (arg: number, index) => `<p class="class-${index}">${arg * 2}</p>`
  }
}).mount(app)

wely({
  name: 'wely3',
  dependencies: child,
  data: () => ({
    number: 100,
    text: 'AA',
    count: 1
  }),
  html: ({ data: { number } }) => ({
    branches: [
      {
        judge: number > 100,
        render: child
      },
      {
        judge: number < 100,
        render: `<p>bbb</p>`
      }
    ],
    fallback: `<slot />`
  }),
  slot: html`
    ${child}
    <p>AAA</p>
  `,
  events: [
    {
      handler: 'click',
      selector: 'slot',
      method: ({ data: { number, text } }, e, index) => console.log(number, text, e, index)
    }
  ]
}).mount(app)

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
}).mount(app)
