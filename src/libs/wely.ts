import { createUniqueId } from './generator'
import { cloneNode, toKebabCase } from './utils'

export class Element extends HTMLElement {
  Id: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = ''
  html: () => string = () => ''
  classes: string[] = []
  css?: string
  slotContent?: string
  events: { [key: string]: () => void } = {}

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })

    this.Id = createUniqueId()
    this.setAttribute('id', this.Id)
  }

  // branch(
  //   condition: boolean | (() => boolean),
  //   truthy: Branch<Element>,
  //   falsity?: Branch<Element> | null
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

  // loop<T>(contents: T[], apply: (arg: T) => Element | string) {
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

      const  = document.getElementById(this.Id)

      if ( && Object.keys(this.events).length > 0) {
        Object.keys(this.events).forEach((handler: string) =>
          .addEventListener(handler, this.events[handler])
        )
      }

      this.isInitial = true
    }

    cloneNode(this.shadowRoot, this.html())
  }
}
