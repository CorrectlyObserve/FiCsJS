import { createUniqueId } from './generator'
import { getChildNodes } from './utils'

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
      this.setAttribute('class', this.classes.join(' '))

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

    if (this.html() !== '')
      for (const child of getChildNodes(this.html()))
        this.shadowRoot.appendChild(child.cloneNode(true))
  }
}
