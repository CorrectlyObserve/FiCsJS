import { Each, EachIf, If,  } from './libs/Types'
import { convert, getChildNodes, toKebabCase } from './libs/utils'
import { Element } from './libs/Element'

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

export const  = <T>(arg: <T>): void => {
  if (arg.name === '' || arg.name === undefined)
    throw new Error('The name argument is not defined...')
  else {
    const Name = `w-${toKebabCase(arg.name)}`

    customElements.define(
      Name,
      class extends Element {
        constructor() {
          super()
          this.name = arg.name

          const html = convert(arg.html)
          const eachHtml = <Each<T>>convert(arg.html)
          const eachIfHtml = <EachIf<T>>convert(arg.html)
          const ifHtml = <If>convert(arg.html)

          if (typeof html === 'string') {
            this.html = () => <string>html
          } else if ('contents' in eachIfHtml && 'branches' in eachIfHtml) {
            let returnedValue: string = ''

            convert(eachIfHtml.contents).forEach((content) => {
              let localValue: string = ''

              for (const branch of convert(eachIfHtml.branches))
                if (convert(branch.judge(content))) {
                  localValue = convert(branch.render(content))
                  break
                }

              if (localValue === '' && eachIfHtml.fallback)
                localValue = convert(eachIfHtml.fallback(content))

              returnedValue += localValue
            })

            this.html = () => returnedValue
          } else if ('contents' in eachHtml) {
            this.html = () =>
              convert(eachHtml.contents).reduce(
                (prev: string, self: T): string =>
                  prev + (eachHtml.render(self) || ''),
                ''
              )
          } else if ('branches' in ifHtml) {
            let returnedValue: string = ''

            for (const branch of convert(ifHtml.branches))
              if (convert(branch.judge)) {
                returnedValue = convert(branch.render)
                break
              }

            if (returnedValue === '' && ifHtml.fallback)
              returnedValue = convert(ifHtml.fallback)

            this.html = () => returnedValue
          }

          this.classes.push(Name)

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

export const mount = (parent: string, element: string): void => {
  for (const child of getChildNodes(element))
    document.getElementById(parent)?.appendChild(child.cloneNode(true))
}

({
  name: '',
  html: `<p>aaa</p>`,
})

({
  name: '2',
  html: () => {
    return {
      contents: [1, 2, 3],
      render: (arg: number) => `<p>${arg * 2}</p>`,
    }
  },
  className: 'WWWW EEEE',
})

({
  name: '3',
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

({
  name: '4',
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
// ({
//   name: 'branch',
//   className: 'aaa',
//   html: () => `<p>Hello world</p><w-aaa></w-aaa>`,
//   css: `p { color: green; }`,
//   events: {
//     click: () => console.log('worked!'),
//   },
// })

mount('app', '<w-2></w-2><w-3></w-3><w-4></w-4>')

// Counterの実装
// ({
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
