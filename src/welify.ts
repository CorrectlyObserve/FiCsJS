import { Each, EachIf, If, Welify } from './libs/welifyTypes'
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
  if (arg.name === '' || arg.name === undefined)
    throw new Error('The name argument is not defined...')
  else {
    const welyName = `w-${toKebabCase(arg.name)}`

    customElements.define(
      welyName,
      class extends WelyElement {
        constructor() {
          super()
          this.name = arg.name

          const eachHtml = <Each<T>>convert(arg.html)
          const eachIfHtml = <EachIf<T>>convert(arg.html)
          const ifHtml = <If>convert(arg.html)

          if (typeof convert(arg.html) === 'string') {
            this.html = () => <string>convert(arg.html)
          } else if ('contents' in eachIfHtml && 'branches' in eachIfHtml) {
            let html: string = ''

            convert(eachIfHtml.contents).forEach((content) => {
              let value: string = ''

              for (const branch of convert(eachIfHtml.branches))
                if (convert(branch.judge(content))) {
                  value = convert(branch.render(content))
                  break
                }

              if (value === '' && eachIfHtml.fallback)
                value = convert(eachIfHtml.fallback(content))

              html += value
            })

            this.html = () => html
          } else if ('contents' in eachHtml) {
            this.html = () =>
              convert(eachHtml.contents).reduce(
                (prev: string, self: T): string =>
                  prev + (eachHtml.render(self) || ''),
                ''
              )
          } else if ('branches' in ifHtml) {
            let html: string = ''

            for (const branch of convert(ifHtml.branches))
              if (convert(branch.judge)) {
                html = convert(branch.render)
                break
              }

            if (html === '' && ifHtml.fallback) html = convert(ifHtml.fallback)

            this.html = () => html
          }

          this.classes.push(welyName)

          if (arg.className)
            for (const className of arg.className.split(' '))
              this.classes.push(toKebabCase(className))

          this.css = arg.css
          this.slotContent = arg.slot
          this.events = { ...arg.events }
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
  name: 'wely',
  html: `<p>aaa</p>`,
})

welify({
  name: 'Wely2',
  html: () => {
    return {
      contents: [1, 2, 3],
      render: (arg: number) => `<p>${arg * 2}</p>`,
    }
  },
  className: 'WWWW EEEE',
})

welify({
  name: 'wely3',
  html: () => {
    return {
      branches: () => [
        {
          judge: false,
          render: () => `<p>aaa</p>`,
        },
        {
          judge: () => 444 > 0,
          render: `<slot />`,
        },
        {
          judge: 333,
          render: () => `<p>CCC</p>`,
        },
      ],
    }
  },
  slot: `<p>DDD</p>`,
  events: {
    click: () => console.log('worked!'),
  },
})

welify({
  name: 'Wely4',
  html: {
    contents: () => [1, 2, 3],
    branches: () => [
      {
        judge: (arg: number) => arg % 2 !== 0,
        render: (arg: number) => `<p>${arg * 2}</p>`,
      },
      {
        judge: (arg: number) => typeof arg === 'number',
        render: (arg: number) => `<p>${arg}</p>`,
      },
    ],
    fallback: (arg: number) => `<p>${arg * 10}</p>`,
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

mountWely('app', '<w-wely2></w-wely2><w-wely3></w-wely3><w-wely4></w-wely4>')

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
//       judge: () => false,
//         truthy: '<h2>John</h2>',
//           falsy: self.child().branch(1 > 0, (child) => child.child().branch(1 > 0, 'yes2', 'no2'), 'no')
//     }
//   )
//   .render()
