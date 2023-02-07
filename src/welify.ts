import { WelyArgs } from './libs/types'
import { toKebabCase } from './libs/utils'
import { WelyElement } from './libs/welyClass'

/*
技術仕様
1. 関数welyによってコンポーネントを生成する -> 完了
2. 生成したコンポーネントをページのidか親コンポーネントの中で呼び出す -> 完了
3. 引数のオブジェクトのDataの中をデータバインディング
4. data: {
  value: $value
} とやるとpropsになる
5. eventsの中で関数を定義する -> できたが、良いコードか要検証
6. 各コンポーネントにはユニークなidを振る -> 完了
7. eventsの中が変化したら自動でイベントハンドラの変更削除を行う
8. slot -> myChip.slot('username', `<h2>John</h2>`).render()と書きたい(slot="username"は不要) -> できたが、良いコードか要検証
9. 多言語翻訳
10. styleでcssを指定する
11. Renderメソッドは最後の一回ものが表示される
*/

const welify = ({ name, parent, html, css, events }: WelyArgs): WelyElement => {
  const welyName: string = `w-${toKebabCase(name)}`

  class WelifiedElement extends WelyElement {
    welyName() {
      return welyName
    }

    parent() {
      return parent
    }

    html() {
      return html
    }

    css() {
      return css
    }

    events() {
      return events
    }
  }

  customElements.get(welyName) ||
    customElements.define(welyName, WelifiedElement)

  return document.createElement(welyName) as WelyElement
}

const myChip = welify({
  name: 'TextText',
  parent: 'app',
  html: `<p>aaa</p><slot />`,
  css: `p { color: green; }`,
  events: {
    click: () => console.log('worked!'),
  },
})

myChip.embed(`<h2>John2</h2>`).render()
myChip.branch(() => true, '<h2>John</h2>').render()

myChip
  .loop([1, 2, 3], (arg) =>
    myChip.branch(() => true, `<p>${arg}</p>`, `<h2>${arg}</h2>`)
  )
  .render()

const aaa = welify({
  name: 'TextText2',
  parent: myChip.welyId,
  html: `<p>aaa!</p><slot name="name"></slot><style>h2 { color: blue; }</style>`,
  css: `p { color: blue; }`,
  events: {
    click: () => console.log('worked2!'),
  },
})

aaa.embed('name', `<h2>John3</h2>`).render()

myChip
  .branch(
    () => true,
    myChip.loop([1, 2, 3], (arg: number) => `<p>${arg}</p>`),
    myChip.loop([1, 2, 3], (arg: number) => `<p>${arg}</p>`)
  )
  .render()

myChip.branch(() => true, '<h2>John</h2>').render()
myChip
  .loop([1, 2, 3], (arg: number) =>
    myChip.branch(() => true, `<h2>${arg}</h2>`, `<h1>${arg}</h1>`)
  )
  .render()
