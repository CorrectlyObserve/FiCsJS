import {  } from '@/libs/class'
import { Constructor, Define, Each, EachIf, Html, If } from '@/libs/types'
import { convertToArray, toKebabCase } from '@/libs/utils'
import cssUrl from './style.css?inline'

const kebabName = (name: string) => toKebabCase(name)
const Name = (name: string): string => `w-${kebabName(name)}`

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
  if (!customElements.get(Name(name)))
    customElements.define(
      Name(name),
      class extends <D, P> {
        static create(partialData = () => ({})): <D, P> {
          const  = <<D, P>>document.createElement(Name(name))

          if (data) .data = { ...data(), ...partialData() }
          if (inheritances) .inheritances = [...inheritances]

          .classes.push(kebabName(name))
          if (className)
            for (const localName of className.split(' ')) .classes.push(kebabName(localName))

          let converter =
            typeof html === 'function'
              ? html({ data: { ....data }, props: { ....props } })
              : html

          if (typeof converter === 'string') .html = convertToArray(<Html | Html[]>converter)
          else if ('contents' in <Each<T> | EachIf<T>>converter) {
            .isEach = true

            if ('branches' in <EachIf<T>>converter)
              (<EachIf<T>>converter).contents.forEach((content, index) => {
                for (const branch of (<EachIf<T>>converter).branches)
                  if (branch.judge(content)) .html.push(branch.render(content, index))

                const fallback = (<EachIf<T>>converter)?.fallback
                if (fallback !== undefined) .html.push(fallback(content, index))
              })
            else
              (<Each<T>>converter).contents.forEach((content, index) =>
                .html.push((<Each<T>>converter).render(content, index) ?? '')
              )
          } else if ('branches' in <If>converter) {
            for (const branch of (<If>converter).branches)
              if (branch.judge) {
                .html.push(branch.render)
                break
              }

            const fallback = (<If>converter)?.fallback
            if (.html.length === 0 && fallback) .html.push(fallback)
          } else .html = convertToArray(<Html | Html[]>converter)

          if (css) .css = [...css]
          if (slot)
            .slotContent =
              typeof slot === 'function'
                ? slot({ data: { ....data }, props: { ....props } })
                : slot

          if (events) .events = [...events]

          return 
        }

        toString() {
          return 'aaa'
        }
      }
    )

  return <Constructor<D>>customElements.get(Name(name))
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
      props: ({ color, click }) => ({ color, click })
    }
  ],
  html: () => parent
}).create()

const parent2 = define({
  name: 'parent2',
  data: () => ({ numbers: [1, 2, 3], color: 'green' }),
  html: () => [`<span>${child2}</span>`, `<p><span>Text</span></p>`]
}).create()

// const 3 = define({
//   name: '3',
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

// const 4 = define({
//   name: '4',
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
