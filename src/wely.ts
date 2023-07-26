import { Wely } from '@/libs/class'
import { Constructor, Define, Html } from '@/libs/types'
import { generator, toKebabCase } from '@/libs/utils'
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

const html = (
  templates: TemplateStringsArray,
  ...elements: (HTMLElement | unknown)[]
): DocumentFragment => {
  let html: string = ''
  const generatedId = generator.next().value

  templates.forEach((template, index) => {
    html += template

    if (index !== templates.length - 1)
      html +=
        elements[index] instanceof HTMLElement
          ? `<var id="placeholder-id${generatedId}-${index}"></var>`
          : elements[index]
  })

  const dom = new DOMParser().parseFromString(html, 'text/html').body
  let fragment = new DocumentFragment()

  while (dom.firstChild) fragment.appendChild(dom.firstChild)

  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      const placeholder = fragment.getElementById(`placeholder-id${generatedId}-${index}`)

      if (placeholder) placeholder.replaceWith(element)
      else throw Error(`The element with an applicable id is not found...`)
    }
  })

  return fragment
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

const child = childClass.create()
const child2 = childClass.create()

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
  html: ({ data: { color } }) => html`${parent}${color}`
}).create()

const parent2 = define({
  name: 'parent2',
  data: () => ({ numbers: [1, 2, 3], color: 'green' }),
  html: () => child2
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

export const mount = (parent: string, child: Html): void => {
  document.getElementById(<string>parent)?.appendChild(<Node>child)
}

mount('app', html`${grandParent}${parent2}`)
