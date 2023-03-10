import { createUniqueId } from './generator'
import { cloneNode, toKebabCase } from './utils'

export class Element extends HTMLElement {
  Id: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = ''
  html: () => string = () => ''
  classes: Array<string> = []
  css?: string
  slotContent?: string
  events: { [key: string]: () => void } = {}

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })

    this.Id = createUniqueId()
    this.setAttribute('id', this.Id)
  }

  connectedCallback(): void {
    if (!this.isInitial) {
      this.setAttribute('class', toKebabCase(this.classes.join(' ')))

      if (this.css) {
        const css = document.createElement('style')
        css.textContent = this.css
        this.shadowRoot.appendChild(css)
      }

      if (this.slotContent)
        this.insertAdjacentHTML('beforeend', this.slotContent)

      const  = document.getElementById(this.Id)

      if ( && Object.keys(this.events).length > 0)
        Object.keys(this.events).forEach((handler: string) =>
          .addEventListener(handler, this.events[handler])
        )

      this.isInitial = true
    }

    cloneNode(this.shadowRoot, this.html())
  }
}
