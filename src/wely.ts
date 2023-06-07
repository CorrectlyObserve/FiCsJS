import { Wely } from '@/libs/class'
import { Each, EachIf, Html, If, Welify } from '@/libs/types'
import { convertToArray, toKebabCase } from '@/libs/utils'
import cssUrl from './style.css?url'

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
}: Welify<T, D, P>): void => {
  if (!customElements.get(`w-${toKebabCase(name)}`))
    customElements.define(
      name,
      class extends Wely<D, P> {
        constructor() {
          super()
          if (data) this.data = <D>{ ...data }
          if (props) this.props = <P>{ ...props }
          if (inheritances) this.inheritances = [...inheritances]

          this.classes.push(toKebabCase(name))
          if (className)
            for (const localName of className.split(' ')) this.classes.push(toKebabCase(localName))

          let converter =
            typeof html === 'function'
              ? html({ data: { ...this.data }, props: { ...this.props } })
              : html

          if ('contents' in <Each<T> | EachIf<T>>converter) {
            this.isEach = true

            if ('branches' in <EachIf<T>>converter)
              (<EachIf<T>>converter).contents.forEach((content, index) => {
                for (const branch of (<EachIf<T>>converter).branches)
                  if (branch.judge(content)) this.html.push(branch.render(content, index))

                const fallback = (<EachIf<T>>converter)?.fallback
                if (fallback !== undefined) this.html.push(fallback(content, index))
              })
            else
              (<Each<T>>converter).contents.forEach((content, index) =>
                this.html.push((<Each<T>>converter).render(content, index) ?? '')
              )
          } else if ('branches' in <If>converter) {
            for (const branch of (<If>converter).branches)
              if (branch.judge) {
                this.html.push(branch.render)
                break
              }

            const fallback = (<If>converter)?.fallback
            if (this.html.length === 0 && fallback) this.html.push(fallback)
          } else this.html = convertToArray(<Html | Html[]>converter)

          if (css) this.css = [...css]
          if (slot) this.slotContent = slot
          if (events) this.events = [...events]
        }
      }
    )
}

const create = <T, D, P>({
  name,
  data,
  props,
  inheritances,
  className,
  html,
  css,
  slot,
  events
}: Welify<T, D, P>): HTMLElement => {
  define({ name, data, props, inheritances, className, html, css, slot, events })

  console.log(new (customElements.get(`w-${toKebabCase(name)}`) as { new (): Wely<D, P> })().data)

  return new (customElements.get(`w-${toKebabCase(name)}`) as { new (): Wely<D, P> })()
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

const child = create({
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

const child1 = create({
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

const parent = create({
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
  html: child,
  css: [`p {color: green;}`]
})

const parent2 = create({
  name: 'parent2',
  data: {
    numbers: [1, 2, 3],
    color: 'green'
  },
  html: child
})

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
  const localParent = document.getElementById(<string>parent)

  if (localParent)
    for (let child of convertToArray(children))
      typeof child === 'string'
        ? localParent.insertAdjacentHTML('beforeend', child)
        : localParent.insertAdjacentElement('beforeend', child)
}

mount('app', [parent, parent2])
