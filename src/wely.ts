import { Wely } from '@/libs/class'
import { Constructor, Define, Html } from '@/libs/types'
import { generator, insertAdjacently, toKebabCase } from '@/libs/utils'
import cssUrl from './style.css?inline'

const define = <T, D, P>({
  name,
  className,
  data,
  html,
  css,
  slot,
  events
}: Define<T, D, P>): Constructor<D, P> => {
  const welyName = (name: string): string => `w-${toKebabCase(name)}`

  if (!customElements.get(welyName(name)))
    customElements.define(
      welyName(name),
      class extends Wely<T, D, P> {
        static create(
          { data: partialData, inheritances: inheritances } = { data: () => {}, inheritances: [] }
        ): Wely<T, D, P> {
          const wely = <Wely<T, D, P>>document.createElement(welyName(name))
          const integratedData = <D>{
            ...(data ? data() : {}),
            ...(partialData ? partialData() : {})
          }

          wely.initialize({
            name,
            className,
            integratedData,
            inheritances,
            html,
            css,
            slot,
            events
          })

          return wely
        }
      }
    )

  return <Constructor<D, P>>customElements.get(welyName(name))
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
          ? `<w-var id="placeholder-id${generatedId}-${index}"></w-var>`
          : elements[index]
  })

  const dom = new DOMParser().parseFromString(html, 'text/html').body
  const fragment = new DocumentFragment()
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

const child = childClass.create({})

const parent = define({
  name: 'parent',
  className: 'test',
  html: `<slot />`,
  slot: child
}).create({})

const grandParent = define({
  name: 'grandParent',
  data: () => ({
    color: 'green',
    click: (message: string) => console.log(message)
  }),
  html: ({ data: { color } }) => html`${parent}${color}`
}).create({
  data: () => ({ color: 'blue' }),
  inheritances: [
    {
      descendants: child,
      props: ({ color, click }: Props) => ({ color, click }),
      boundary: 'app'
    }
  ]
})

// const wely2 = define({
//   name: 'Wely2',
//   html: {
//     contents: [1, 2, 3],
//     render: (arg: number, index) => `<p class="class-${index}">${arg * 2}</p>`
//   }
// }).create({})

// const wely3 = define({
//   name: 'wely3',
//   data: () => ({
//     number: 100,
//     text: 'AA',
//     count: 1
//   }),
//   html: ({ data: { number } }) => ({
//     branches: [
//       {
//         judge: number > 100,
//         render: child
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
// }).create({})

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
// }).create({})

export const mount = (parent: string, child: Html): void => {
  const parentElement = document.getElementById(parent)
  if (parentElement) insertAdjacently(parentElement, child)
}

mount('app', grandParent)
