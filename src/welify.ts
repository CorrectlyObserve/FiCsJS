import { Args } from './libs/Types'
import { toKebabCase, getChildNodes } from './libs/utils'
import { Element } from './libs/Element'

/*
技術仕様
1. 関数によってコンポーネントを生成する -> 完了
2. 生成したコンポーネントをページのidか親コンポーネントの中で呼び出す -> 完了
3. 引数のオブジェクトのDataの中をデータバインディング
4. data: {
  value: $value
} とやるとpropsになる
5. eventsの中で関数を定義する -> 完了
6. 各コンポーネントにはユニークなidを振る -> 完了
7. slot -> myChip.slot('username', `<h2>John</h2>`).render()と書きたい(slot="username"は不要) -> 完了
8. 多言語翻訳（今後の話）
9. styleでcssを指定する -> 完了
10. Renderメソッドは最後の一回ものが表示される
11. 状態管理（今後の話）
12. ルーティング（今後の話）
13. PWA（今後の話）
14. CSS in JSを実現（https://vanilla-extract.style/）
15. svgによるグラフ作成（今後の話）
16. emitとpropsの血縁関係に依存した状態管理
17. Vueでいうwatch的な機能（今後の話）
18. Eventsをコンポーネントの全体ではなく、一部に適用できるようにする
*/

export const  = <T>(arg: Args<T>): void => {
  if (arg.name === '' || arg.name === undefined) {
    throw new Error('The name argument is not defined...')
  } else {
    const Name = `w-${toKebabCase(arg.name)}`

    customElements.define(
      Name,
      class extends Element {
        constructor() {
          super()
          this.name = arg.name

          switch (arg.syntax) {
            case 'if':
              this.html = () => {
                const condition = () => {
                  if (typeof arg.if === 'function')
                    return Function(`return ${arg.if}`)()()

                  return arg.if
                }

                if (condition()) return arg.html()

                return arg.else ? arg.else() : ''
              }
              break

            case 'each':
              this.html = () =>
                arg
                  .html()
                  .reduce(
                    (prev: string, self: T): string =>
                      `${prev}${arg.display(self)}`,
                    ''
                  )
              break

            default:
              this.html = () => arg.html()
          }

          this.classes.push(Name)
          if (arg.className) this.classes.push(toKebabCase(arg.className))

          this.css = arg.css
          this.slotContent = arg.slot
          this.events = { ...arg.events }
        }
      }
    )
  }
}

export const mount = (parent: string, element: string): void => {
  for (const child of getChildNodes(element)) {
    document.getElementById(parent)?.appendChild(child.cloneNode(true))
  }
}

({
  name: '',
  syntax: 'each',
  html: () => [1, 2, 3],
  display: (arg: number) => `<p>${arg * 2}</p><slot name="${arg}"></slot>`,
})

({
  name: '2',
  syntax: 'if',
  if: () => true,
  html: () => `<p>aaa</p>`,
  else: () => `<h2>bbbb</h2>`,
})

({
  name: '3',
  syntax: 'if',
  if: true,
  html: () => `<p>aaa!</p>`,
  else: () => `<w-2></w-2>`,
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

mount('app', '<w-></w-><w-3></w-3>')

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
//       condition: () => false,
//         truthy: '<h2>John</h2>',
//           falsy: self.child().branch(1 > 0, (child) => child.child().branch(1 > 0, 'yes2', 'no2'), 'no')
//     }
//   )
//   .render()