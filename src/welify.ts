import { appendChild, toKebabCase } from '@/libs/utils'
import { Css, Welify } from '@/libs/welifyTypes'
import { WelyElement } from '@/libs/welyElement'

/*
技術仕様
1. 引数のオブジェクトのDataの中をデータバインディング
2. emitとpropsの血縁関係に依存した状態管理
3. 多言語翻訳（今後の話）
4. 状態管理（今後の話）
5. ルーティング（今後の話）
6. PWA（今後の話）
7. svgによるグラフ作成（今後の話）
8. Vueでいうwatch的な機能（今後の話）
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
  events,
  delegatedEvents
}: Welify<T, D, P>): WelyElement<D, P> => {
  if (name === '' || name === undefined)
    throw new Error('The name argument is not defined...')
  else {
    const kebabName = toKebabCase(name)
    const welyName = `w-${kebabName}`

    customElements.define(
      welyName,
      class extends WelyElement<D, P> {
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

          const converter =
            typeof html === 'function'
              ? html({ ...this.data }, { ...this.props })
              : html

          if (typeof converter === 'string') this.html = converter
          else if ('contents' in converter && 'branches' in converter) {
            this.isEach = true

            let html: string = ''

            html += converter.contents
              .map((content, index) => {
                for (const branch of converter.branches)
                  if (branch.judge(content))
                    return branch.render(content, index)

                if (converter.fallback)
                  return converter.fallback(content, index)

                return ''
              })
              .join('')

            this.html = html
          } else if ('contents' in converter) {
            this.isEach = true

            this.html = converter.contents.reduce(
              (prev: string, self: T, index: number): string =>
                prev + converter.render(self, index),
              ''
            )
          } else if ('branches' in converter) {
            let html: string = ''

            for (const branch of converter.branches)
              if (branch.judge) {
                html = branch.render
                break
              }

            if (html === '' && converter.fallback) html = converter.fallback

            this.html = html
          }

          if (css !== undefined)
            this.css = typeof css === 'string' ? css : ([...css] as Css<D, P>)

          if (slot) this.slotContent = slot

          this.events = { ...events }

          if (delegatedEvents && delegatedEvents.length > 0)
            this.delegatedEvents = [...delegatedEvents]
        }
      }
    )

    return new (customElements.get(welyName) as { new (): WelyElement<D, P> })()
  }
}

const child = welify({
  name: 'child',
  data: {
    count: 1,
    message: 'Hello',
    back: 'black',
    childMessage: 'Child hello'
  },
  html: (data, { color }: { color: string }) =>
    `<p class="hello">${color}</p><div><p class="hello">${data.childMessage}</p></div>`,
  // css: [
  //   {
  //     selector: 'p',
  //     style: ({ data: { color } }) => ({
  //       color: color,
  //       fontSize: '14px'
  //     })
  //   },
  //   {
  //     selector: 'div',
  //     style: ({ data: { back } }: { data: { back: string } }) => ({
  //       background: back
  //     })
  //   }
  // ],
  css: ['src/style.css'],
  events: {
    click: ({ data: { count } }) => console.log(count++)
  },
  delegatedEvents: [
    {
      selector: 'div .hello',
      click: ({ data: { message } }) => console.log(message)
    }
  ]
})

const parent = welify({
  name: 'parent',
  data: {
    color: 'green'
  },
  inheritances: [
    {
      elements: [child],
      props: ({ color }) => ({ color: color })
    }
  ],
  html: () => `${child.outerHTML}${child.outerHTML}`
})

// const wely2 = welify({
//   name: 'Wely2',
//   data: {
//     numbers: [1, 2, 3],
//     color: 'green'
//   },
//   html: ({ data: { numbers } }) => ({
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
//   html: ({ data: { number } }) => ({
//     branches: [
//       {
//         judge: number >= 100,
//         render: child.outerHTML
//       },
//       {
//         judge: number < 100,
//         render: `<p>bbb</p>`
//       }
//     ],
//     fallback: `<p>${number}</p>`
//   }),
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
//   html: ({ data: { numbers } }) => ({
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

export const mountWely = (parent: string, elements: string) =>
  appendChild(<HTMLElement>document.getElementById(parent), elements)

mountWely('app', parent.outerHTML)
