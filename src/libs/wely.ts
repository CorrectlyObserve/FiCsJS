import { createUniqueId } from './generator'
import { cloneNode, toKebabCase } from './utils'

export class WelyElement extends HTMLElement {
  welyId: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = 'wely'
  html: () => string = () => ''
  classes: string[] = []
  css?: string
  slotContent?: string
  events: { [key: string]: () => void } = {}

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })

    this.welyId = createUniqueId()
    this.setAttribute('id', this.welyId)
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

  connectedCallback(): void {
    if (!this.isInitial) {
      this.setAttribute('class', toKebabCase(this.classes.join(' ')))

      if (this.css) {
        const style = document.createElement('style')
        style.textContent = this.css
        this.shadowRoot.appendChild(style)
      }

      if (this.slotContent) {
        this.insertAdjacentHTML('beforeend', this.slotContent)
      }

      const wely = document.getElementById(this.welyId)

      if (wely && Object.keys(this.events).length > 0) {
        Object.keys(this.events).forEach((handler: string) =>
          wely.addEventListener(handler, this.events[handler])
        )
      }

      this.isInitial = true
    }

    cloneNode(this.shadowRoot, this.html())
  }
}
