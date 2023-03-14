import { Welify } from './libs/welifyTypes'
import { convert, getChildNodes, toKebabCase } from './libs/utils'
import { WelyElement } from './libs/welyElement'

/*
技術仕様
1. 引数のオブジェクトのDataの中をデータバインディング
2. data: { value: $value } とやるとpropsになる
3. CSS in JSを実現（https://vanilla-extract.style/）
4. emitとpropsの血縁関係に依存した状態管理
5. Eventsをコンポーネントの全体ではなく、一部に適用できるようにする
6. 多言語翻訳（今後の話）
7. 状態管理（今後の話）
8. ルーティング（今後の話）
9. PWA（今後の話）
10. svgによるグラフ作成（今後の話）
11. Vueでいうwatch的な機能（今後の話）
*/

export const welify = <T>(arg: Welify<T>): void => {
  if (arg.name === '' || arg.name === undefined) {
    throw new Error('The name argument is not defined...')
  } else {
    const welyName = `w-${toKebabCase(arg.name)}`

    customElements.define(
      welyName,
      class extends WelyElement {
        constructor() {
          super()
          this.name = arg.name

          switch (arg.syntax) {
            case 'if':
              let html: string = ''

              for (const branch of arg.branches())
                if (convert(branch.condition)) {
                  html = convert(branch.html)
                  break
                }

              if (html === '' && arg.fallback) html = convert(arg.fallback)

              this.html = () => html
              break

            case 'each':
              this.html = () =>
                convert(arg.html).reduce((prev: string, self: T): string => {
                  if (arg.mount(self) === undefined) return prev

                  return `${prev}${arg.mount(self)}`
                }, '')
              break

            default:
              this.html = () => convert(arg.html)
          }

          this.classes.push(welyName)
          if (arg.className)
            for (const className of arg.className.split(' '))
              this.classes.push(toKebabCase(className))

          this.css = arg.css
          this.slotContent = arg.slot
          this.events = { ...arg.events }
        }

        connectedCallback(): void {
          super.connectedCallback()

          if (arg.syntax === 'if' && this.html() === '')
            this.setAttribute('style', 'display:none')
        }
      }
    )
  }
}

export const mountWely = (parent: string, element: string): void => {
  for (const child of getChildNodes(element))
    document.getElementById(parent)?.appendChild(child.cloneNode(true))
}

welify({
  name: 'Wely',
  syntax: 'each',
  html: [1, 2, 3],
  mount: (arg: number) => {
    if (arg % 2 !== 0) {
      return `<p>${arg * 2}</p>`
    }

    return

    // return `<p>${arg}</p>`
  },
  className: 'WWWW EEEE',
})

welify({
  name: 'wely3',
  html: `<p>aaa</p>`,
})

welify({
  name: 'wely2',
  syntax: 'if',
  branches: () => [
    {
      condition: false,
      html: () => `<p>aaa</p>`,
    },
    {
      condition: () => 444,
      html: `<slot />`,
    },
    {
      condition: 333,
      html: () => `<p>CCC</p>`,
    },
  ],
  slot: `<p>DDD</p>`,
  events: {
    click: () => console.log('worked!'),
  },
})

// Hello worldの実装
// welify({
//   name: 'branch',
//   className: 'aaa',
//   html: () => `<p>Hello world</p><w-aaa></w-aaa>`,
//   css: `p { color: green; }`,
//   events: {
//     click: () => console.log('worked!'),
//   },
// })

mountWely('app', '<w-wely></w-wely>')

// Counterの実装
// welify({
//   name: 'counter',
//   parent: 'app',
//   data: {
//     values: {
//       count: 0,
//       color: 'green',
//     },
//     props: {},
//   },
//   html: (data) => `<p>${data.values.count}</p>`,
//   css: {
//     selector: 'p',
//     style: `color: ${data.values.color}`,
//   },
//   events: {
//     click: () => data.values.count++,
//   },
// }).render()

// Branchの引数に1つの関数
// 関数は3つの引数を返すような感じ
// .branch(
//   (self) => {
//     return {
//       condition: () => false,
//         truthy: '<h2>John</h2>',
//           falsy: self.child().branch(1 > 0, (child) => child.child().branch(1 > 0, 'yes2', 'no2'), 'no')
//     }
//   )
//   .render()
