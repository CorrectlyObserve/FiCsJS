import { Wely } from '@/libs/class'
import { Constructor, Define, Html } from '@/libs/types'
import { convertToArray, toKebabCase } from '@/libs/utils'
import cssUrl from './style.css?inline'

const define = <T, D, P>({
  name,
  data,
  inheritances,
  className,
  html,
  css,
  slot,
  events
}: Define<T, D, P>): Constructor<D> => {
  const welyName = (name: string): string => `w-${toKebabCase(name)}`

  if (!customElements.get(welyName(name)))
    customElements.define(
      welyName(name),
      class extends Wely<T, D, P> {
        static create(partialData = () => ({})): Wely<T, D, P> {
          const wely = <Wely<T, D, P>>document.createElement(welyName(name))
          const dataObj = <D>{ ...(data ? data() : {}), ...partialData() }

          wely.initialize({
            name,
            dataObj,
            inheritances,
            className,
            html,
            css,
            slot,
            events
          })

          return wely
        }
      }
    )

  return <Constructor<D>>customElements.get(welyName(name))
}

const wrap = (templates: TemplateStringsArray, ...elements: HTMLElement[]) => {
  const html: Html[] = []
  templates.forEach((template, index) => {
    html.push(template)
    if (index !== templates.length - 1) html.push(elements[index])
  })

  console.log(html)
  return html
}

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

const childClass = define({
  name: 'child',
  data: () => ({
    count: 1,
    fontSize: 16,
    message: 'Hello',
    back: 'black'
  }),
  html: ({ data: { message }, props: { color } }: { data: Data; props: Props }) => [
    `<div><p class="hello" style="display: inline">${message}</p></div>`,
    `<p>${color}</p>`
  ],
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

const child = childClass.create()
const child2 = childClass.create()

child.html = []
console.log(child, child.html)

const parent = define({
  name: 'parent',
  html: child
}).create()

const grandParent = define({
  name: 'grandParent',
  data: () => ({
    color: 'green',
    click: (message: string) => console.log(message)
  }),
  inheritances: [
    {
      descendants: child,
      props: ({ color, click }) => ({ color, click }),
      boundary: 'app'
    }
  ],
  html: () => parent
}).create()

const parent2 = define({
  name: 'parent2',
  data: () => ({ numbers: [1, 2, 3], color: 'green' }),
  html: () => [...wrap`<span>${child2}</span>`, `<p><span>Text</span></p>`]
}).create()

// const wely3 = define({
//   name: 'wely3',
//   data: () => ({
//     number: 100,
//     text: 'AA',
//     count: 1,
//     message: 'Hello',
//     color: 'red',
//     back: 'black',
//     _childMessage: 'Child hello'
//   }),
//   html: ({ data: { number } }) => ({
//     branches: [
//       {
//         judge: number > 100,
//         render: child.outerHTML
//       },
//       {
//         judge: number < 100,
//         render: `<p>bbb</p>`
//       }
//     ],
//     fallback: `<slot />`
//   }),
//   slot: `<p>AAA</p>`,
//   events: [
//     {
//       handler: 'click',
//       selector: 'slot',
//       method: ({ data: { number, text } }, e, index) => console.log(number, text, e, index)
//     }
//   ]
// }).create()

// const wely4 = define({
//   name: 'Wely4',
//   data: () => ({
//     numbers: [1, 2, 3]
//   }),
//   html: ({ data: { numbers } }: { data: { numbers: number[] } }) => ({
//     contents: numbers,
//     branches: [
//       {
//         judge: arg => arg === 100,
//         render: (arg: number, index) => `<p class="class-${index}">${arg * 2}</p>`
//       },
//       {
//         judge: arg => typeof arg !== 'number',
//         render: (arg, index) => `<p class="class-${index}">${arg}</p>`
//       }
//     ],
//     fallback: (arg: number) => `<p class="class-z">${arg * 10}</p>`
//   }),
//   events: [
//     {
//       selector: '.class-z',
//       handler: 'click',
//       method: ({ data: { numbers } }, e, index) => console.log(numbers[index ?? 0], e)
//     }
//   ]
// }).create()

export const mount = (parent: string, children: Html | Html[]): void => {
  const parentElement = document.getElementById(<string>parent)

  if (parentElement)
    for (const child of convertToArray(children))
      typeof child === 'string'
        ? parentElement.insertAdjacentHTML('beforeend', child)
        : parentElement.insertAdjacentElement('beforeend', child)
}

mount('app', [grandParent, parent2])
