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
    countedNum: (count: number) => count * 3
  }),
  isOnlyCsr: true,
  className: ({ data: { back } }) => back,
  html: ({
    data: { message, count, countedNum },
    props: { color }
  }: {
    data: { message: string; count: number; countedNum: (count: number) => number }
    props: { color: string; click: (message: string) => void }
  }) => html`<div><p class="hello" style="display: inline">${message}</p></div>
    <p>${color}</p>
    <p>${countedNum(count)}</p>`,
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
      method: ({ data: { obj, arr }, setData }) => {
        setData('obj', { ...obj })
        setData('arr', [...arr])
      }
    },
    {
      selector: 'div',
      handler: 'click',
      method: ({ data: { message }, props: { click } }) => click(message)
    }
  ],
  reflections: {
    count: count => console.log('count', count)
  }
})

const child2 = child.overwrite(() => ({ message: 'Good bye' }))

const parent = wely({
  name: 'parent',
  data: () => ({
    color: 'blue',
    click: (message: string) => console.log(message)
  }),
  props: [
    {
      descendants: child2,
      values: getData => ({ color: getData('color'), click: getData('click') })
    }
  ],
  className: 'test',
  html: ({ props: { propsColor } }: { props: { propsColor: string } }) =>
    html`${child2}
      <p>propsColor: ${propsColor}</p>`
})

const grandParent = wely({
  name: 'grandParent',
  data: () => ({ color: 'green', fontSize: 24, number: 12, email: '' }),
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
  ],
  events: [
    {
      handler: 'click',
      method: ({ setData }) => setData('color', 'red')
    }
  ]
})

// console.log(grandParent.ssr())

grandParent.define()

fetch('https://jsonplaceholder.typicode.com/comments/1')
  .then(response => response.json())
  .then(json => grandParent.setData('email', json.email))

let count = child.getData('count')

const timer = setInterval(() => {
  if (count >= 4) {
    clearInterval(timer)
    console.log('stop')
  }

  child.setData('count', ++count)

  console.log('continue')
}, 1000)
