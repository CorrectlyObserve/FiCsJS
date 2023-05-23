import { Wely } from '@/libs/class'
import { Each, EachIf, Html, If, Welify } from '@/libs/types'
import { appendChild, toKebabCase } from '@/libs/utils'
// import cssUrl from '@/style.css?url'

/*
技術仕様
1. 引数のオブジェクトのDataの中をデータバインディング
2. emitとpropsの血縁関係に依存した状態管理
3. 多言語翻訳（今後の話）
4. 状態管理（今後の話）
5. PWA（今後の話）
6. svgによるグラフ作成（今後の話）
7. Vueでいうwatch的な機能（今後の話）
8. Singletonsを保障する（今後の話）
9. Headless UI的な（今後の話）
*/

export const welify = <T, D, P>({
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
  if (name === '' || name === undefined)
    throw new Error('The name argument is not defined...')
  else {
    const kebabName = toKebabCase(name)
    const welyName = `w-${kebabName}`

    customElements.define(
      welyName,
      class extends Wely<D, P> {
        constructor() {
          super()
          this.name = kebabName

          if (data) this.data = { ...data }
          if (props) this.props = { ...props }
          if (inheritances) this.inheritances = [...inheritances]

          this.classes.push(kebabName)

          if (className)
            for (const localName of className.split(' '))
              this.classes.push(toKebabCase(localName))

          let converter =
            typeof html === 'function'
              ? html({ data: { ...this.data }, props: { ...this.props } })
              : html

          if ('contents' in <Each<T> | EachIf<T>>converter) {
            this.isEach = true

            if ('branches' in <EachIf<T>>converter)
              (<EachIf<T>>converter).contents.forEach((content, index) => {
                for (const branch of (<EachIf<T>>converter).branches)
                  if (branch.judge(content))
                    this.html.push(branch.render(content, index))

                const fallback = (<EachIf<T>>converter)?.fallback

                if (fallback !== undefined)
                  this.html.push(fallback(content, index))
              })
            else
              (<Each<T>>converter).contents.forEach((content, index) =>
                this.html.push(
                  (<Each<T>>converter).render(content, index) ?? ''
                )
              )
          } else if ('branches' in <If>converter) {
            converter = <If>converter

            for (const branch of converter.branches)
              if (branch.judge) {
                this.html.push(branch.render)
                break
              }

            if (this.html.length === 0 && converter.fallback)
              this.html.push(converter.fallback)
          } else {
            converter = <Html | Html[]>converter
            this.html = Array.isArray(converter) ? [...converter] : [converter]
          }

          this.css = [...(css ?? [])]
          if (slot) this.slotContent = slot
          this.events = [...(events ?? [])]
        }
      }
    )

    return new (customElements.get(welyName) as { new (): Wely<D, P> })()
  }
}

interface Props {
  color: string
  click: (message: string) => void
}

const child = welify({
  name: 'child',
  data: {
    count: 1,
    message: 'Hello',
    color: 'red',
    back: 'black',
    childMessage: 'Child hello'
  },
  html: ({
    data: { childMessage },
    props: { color }
  }: {
    data: { childMessage: string }
    props: Props
  }) => [
    `<div><p class="hello" style="display: inline">${childMessage}</p></div>`,
    `<p>${color}</p>`
  ],
  css: [
    // cssUrl,
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
      method: ({ data: { message }, props }) => props.click(message)
    }
  ]
})

const parent = welify({
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

// const wely2 = welify({
//   name: 'Wely2',
//   data: {
//     numbers: [1, 2, 3],
//     color: 'green'
//   },
//   html: ({ numbers }) => ({
//     contents: numbers as number[],
//     render: (arg: number, index) => `<p class="class-${index}">${arg * 2}</p>`
//   }),
//   events: {
//     click: ({ data: { numbers } }) => console.log(numbers)
//   },
//   delegatedEvents: [
//     {
//       selector: 'p',
//       click: ({ data: { numbers } }, _, index) => console.log(numbers[index])
//     }
//   ]
// })

// const wely3 = welify({
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

// const wely4 = welify({
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

export const mountWely = (parent: string, children: Html | Html[]) =>
  appendChild(parent, children)

mountWely('app', parent)
