import { Wely } from '@/libs/class'
import { Each, EachIf, Html, If, WelyConstructor, Welify } from '@/libs/types'
import { convertToArray, toKebabCase } from '@/libs/utils'
import cssUrl from './style.css?url'

const kebabName = (name: string) => toKebabCase(name)
const welyName = (name: string): string => `w-${kebabName(name)}`

const define = <T, D, P>({
  name,
  data,
  props,
  inheritances,
  className,
  html,
  css,
  slot,
  events
}: Welify<T, D, P>): WelyConstructor<D, P> => {
  if (!customElements.get(welyName(name)))
    customElements.define(
      welyName(name),
      class extends Wely<D, P> {
        static create({
          data: partialData,
          props: partialProps
        }: { data?: Partial<D>; props?: Partial<P> } = {}): Wely<D, P> {
          const wely = <Wely<D, P>>document.createElement(welyName(name))

          if (data) wely.data = <D>partialData ? { ...data, ...partialData } : { ...data }
          if (props) wely.props = <P>partialProps ? { ...props, ...partialProps } : { ...props }
          if (inheritances) wely.inheritances = [...inheritances]

          wely.classes.push(kebabName(name))
          if (className)
            for (const localName of className.split(' ')) wely.classes.push(kebabName(localName))

          let converter =
            typeof html === 'function'
              ? html({ data: { ...wely.data }, props: { ...wely.props } })
              : html

          if (typeof converter === 'string') wely.html = convertToArray(<Html | Html[]>converter)
          else if ('contents' in <Each<T> | EachIf<T>>converter) {
            wely.isEach = true

            if ('branches' in <EachIf<T>>converter)
              (<EachIf<T>>converter).contents.forEach((content, index) => {
                for (const branch of (<EachIf<T>>converter).branches)
                  if (branch.judge(content)) wely.html.push(branch.render(content, index))

                const fallback = (<EachIf<T>>converter)?.fallback
                if (fallback !== undefined) wely.html.push(fallback(content, index))
              })
            else
              (<Each<T>>converter).contents.forEach((content, index) =>
                wely.html.push((<Each<T>>converter).render(content, index) ?? '')
              )
          } else if ('branches' in <If>converter) {
            for (const branch of (<If>converter).branches)
              if (branch.judge) {
                wely.html.push(branch.render)
                break
              }

            const fallback = (<If>converter)?.fallback
            if (wely.html.length === 0 && fallback) wely.html.push(fallback)
          } else wely.html = convertToArray(<Html | Html[]>converter)

          if (css) wely.css = [...css]
          if (slot)
            wely.slotContent =
              typeof slot === 'function'
                ? slot({ data: { ...wely.data }, props: { ...wely.props } })
                : slot

          if (events) wely.events = [...events]

          return wely
        }
      }
    )

  return <WelyConstructor<D, P>>customElements.get(welyName(name))
}

interface Data {
  count: number
  message: string
  color: string
  back: string
  childMessage: string
}

interface Props {
  color: string
  click: (message: string) => void
}

const childClass = define({
  name: 'child',
  data: {
    count: 1,
    message: 'Hello',
    color: 'red',
    back: 'black',
    childMessage: 'Child hello'
  },
  html: ({ data: { childMessage }, props: { color } }: { data: Data; props: Props }) => [
    `<div><p class="hello" style="display: inline">${childMessage}</p></div>`,
    `<p>${color}</p>`
  ],
  css: [
    cssUrl,
    {
      selector: 'p',
      style: () => ({ cursor: 'pointer' })
    },
    {
      selector: 'p.hello',
      style: ({ data: { color } }) => ({
        color: color,
        fontSize: '14px'
      })
    },
    {
      selector: 'div',
      style: ({ data: { back } }) => ({
        background: back
      })
    }
  ],
  events: [
    {
      handler: 'click',
      method: ({ data: { count } }) => console.log(count++)
    },
    {
      handler: 'click',
      selector: 'div',
      method: ({ data: { message }, props: { click } }) => click(message)
    }
  ]
})

const child = childClass.create({})
const child2 = childClass.create({})

const parent = define({
  name: 'parent',
  data: {
    color: 'green',
    click: (message: string) => console.log(message)
  },
  inheritances: [
    {
      elements: child,
      props: ({ color, click }) => ({ color, click })
    }
  ],
  html: child
}).create({ data: { color: 'red' } })

const parent2 = define({
  name: 'parent2',
  data: {
    numbers: [1, 2, 3],
    color: 'green'
  },
  html: () => child2
}).create({})

// const wely3 = define({
//   name: 'wely3',
//   data: {
//     number: 100,
//     text: 'AA',
//     count: 1,
//     message: 'Hello',
//     color: 'red',
//     back: 'black',
//     _childMessage: 'Child hello'
//   },
//   html: ({ number }) => ({
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
//   delegatedEvents: [
//     {
//       selector: 'slot',
//       click: ({ data: { number, text } }, e, index) =>
//         console.log(number, text, e, index)
//     }
//   ]
// })

// const wely4 = define({
//   name: 'Wely4',
//   data: {
//     numbers: [1, 2, 3]
//   },
//   html: ({ numbers }) => ({
//     contents: numbers as number[],
//     branches: [
//       {
//         judge: (arg: number) => arg === 100,
//         render: (arg: number, index) =>
//           `<p class="class-${index}">${arg * 2}</p>`
//       },
//       {
//         judge: (arg: number) => typeof arg !== 'number',
//         render: (arg: number, index) => `<p class="class-${index}">${arg}</p>`
//       }
//     ],
//     fallback: (arg: number) => `<p class="class-z">${arg * 10}</p>`
//   }),
//   delegatedEvents: [
//     {
//       selector: '.class-z',
//       click: ({ data: { numbers } }, e, index) => console.log(numbers[index], e)
//     }
//   ]
// })

export const mount = (parent: string, children: Html | Html[]): void => {
  const parentElement = document.getElementById(<string>parent)

  if (parentElement)
    for (const child of convertToArray(children))
      typeof child === 'string'
        ? parentElement.insertAdjacentHTML('beforeend', child)
        : parentElement.insertAdjacentElement('beforeend', child)
}

mount('app', [parent, parent2])
