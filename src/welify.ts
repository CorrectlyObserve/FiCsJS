import { WelyArgs } from './libs/types'
import { keysInObj, toKebabCase } from './libs/utils'
import { WelyElement } from './libs/wely'

/*
技術仕様
1. 関数welyによってコンポーネントを生成する -> 完了
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
*/
const welify = ({
  name,
  parent,
  html,
  css,
  events = {},
}: WelyArgs): WelyElement => {
  const welyName: string = `w-${toKebabCase(name)}`

  customElements.define(welyName, class extends WelyElement {})

  const welified = <WelyElement>document.createElement(welyName)
  welified.name = name
  welified.parent = parent
  welified.html = html
  welified.css = css

  if (keysInObj(events).is) {
    keysInObj(events).toArray.forEach(
      (handler: string) => (welified.events[handler] = events[handler])
    )
  }

  return welified
}

// Hello worldの実装
welify({
  name: 'HelloWorld',
  parent: 'app',
  html: `<p>Hello world</p>`,
  css: `p { color: green; }`,
  events: {
    click: () => console.log('worked!'),
  },
}).render()

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
//   html: `<p>${data.values.count}</p>`,
//   css: {
//     selector: 'p',
//     style: `color: ${data.values.color}`,
//   },
//   events: {
//     click: () => data.values.count++,
//   },
// }).render()

const myChip = welify({
  name: 'TextText',
  parent: 'app',
  html: `<p>aaa</p><slot />`,
  css: `p { color: green; }`,
  events: {
    click: () => console.log('worked!'),
  },
})

myChip.branch(() => false, '<h2>John</h2>', 'John').render()

myChip
  .loop([1, 2, 3], (arg) =>
    myChip.branch(false, `<p>${arg}</p>`, `<h2>${arg}</h2>`)
  )
  .render()

myChip.branch(() => true, '<h2>John3</h2>', 'John').render()

myChip
  .loop([1, 2, 3], (arg: number) =>
    myChip.branch(arg > 1, `<p>${arg}</p>`, `<h2>${arg}</h2>`)
  )
  .render()

myChip.embed(`<h2>John2</h2>`).render()

myChip
  .branch(
    () => false,
    myChip.loop([1, 2, 3], (arg: number) => `<p>${arg}</p>`),
    myChip.loop([1, 2, 3], (arg: number) => `<h1>${arg}</h1>`)
  )
  .render()

const html = `<p>aaa!</p><slot name="name"></slot><style>h2 { color: blue; }</style>`

const aaa = welify({
  name: 'TextText2',
  parent: 'app',
  html: html,
  css: `p { color: blue; }`,
  events: {
    click: () => console.log('worked2!'),
  },
})

aaa.render()

// aaa.embed('name', `<h2>John3</h2>`).render()

// myChip.branch(() => true, '<h2>John</h2>').render()
// myChip
//   .loop([1, 2, 3], (arg: number) =>
//     myChip.branch(() => true, `<h2>${arg}</h2>`, `<h1>${arg}</h1>`)
//   )
//   .render()
