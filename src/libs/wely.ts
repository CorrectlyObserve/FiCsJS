import { createUniqueId } from './generator'
import { cloneNode, toKebabCase } from './utils'

export class Element extends HTMLElement {
  Id: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = ''
  html: () => string = () => ''
  class?: string
  css?: string
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

  connectedCallback(): void {
    if (!this.isInitial) {
      if (this.css) {
        const style = document.createElement('style')
        style.textContent = this.css
        this.shadowRoot.appendChild(style)
      }

      const  = document.getElementById(this.Id)

      if ( && Object.keys(this.events).length > 0) {
        Object.keys(this.events).forEach((handler: string) =>
          .addEventListener(handler, this.events[handler])
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
