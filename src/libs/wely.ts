import { createUniqueId } from './generator'
// import { Branch } from './types'
import { cloneNode, toKebabCase } from './utils'

/*
Welify仕様

- Stringをマウント
- デフォルトでifコンポーネント、eachコンポーネント、slotコンポーネントを用意
- デフォルトのコンポーネントにも引数を用意してデザインを整えたりイベントハンドラを実行できるようにする
- HTMLを関数に
- Welifyの段階でコンポーネントを登録できるようにする

*/

export class WelyElement extends HTMLElement {
  welyId: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = 'wely'
  html: () => string = () => ''
  class?: string
  css?: string
  events: { [key: string]: () => void } = {}

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })
  }

  // branch(
  //   condition: boolean | (() => boolean),
  //   truthy: Branch<WelyElement>,
  //   falsity?: Branch<WelyElement> | null
  // ) {
  //   const convertByType = <T>(value: T) => {
  //     if (typeof value === 'function') return Function(`return ${value}`)()()

  //     return value
  //   }

  //   this.html.push(
  //     `${convertByType(convertByType(condition) ? truthy : falsity)}`
  //   )

  //   return this
  // }

  // loop<T>(contents: T[], apply: (arg: T) => WelyElement | string) {
  //   this.html.push(
  //     contents.reduce(
  //       (prev: string, self: T): string => `${prev}${apply(self)}`,
  //       ''
  //     )
  //   )

  //   return this
  // }

  // embed(slotId: string, content?: string) {
  //   if (getChildNodes(content || slotId).length > 0) {
  //     const slotTag = `<slot ${content ? `name="${slotId}"` : ''}></slot>`
  //     const slot = <HTMLElement>getChildNodes(content || slotId)[0]

  //     if (content) slot.setAttribute('slot', slotId)

  //     this.html.push(`${slotTag}`)
  //     this.appendChild(slot)
  //   }

  //   return this
  // }

  connectedCallback() {
    if (!this.isInitial) {
      this.welyId = createUniqueId()
      this.setAttribute('id', this.welyId)

      if (this.css) {
        const style = document.createElement('style')
        style.textContent = this.css
        this.shadowRoot.appendChild(style)
      }

      const wely = document.getElementById(this.welyId)

      if (wely && Object.keys(this.events).length > 0) {
        Object.keys(this.events).forEach((handler: string) =>
          wely.addEventListener(handler, this.events[handler])
        )
      }

      this.setAttribute(
        'class',
        toKebabCase(this.class ? `${this.name} ${this.class}` : this.name)
      )

      this.isInitial = true
    }

    cloneNode(this.shadowRoot, this.html())
  }
}
