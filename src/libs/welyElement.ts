import { createUniqueId } from './generator'
import { getChildNodes } from './utils'

export class WelyElement extends HTMLElement {
  welyId: string = ''
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

    this.welyId = createUniqueId()
    this.setAttribute('id', this.welyId)
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

      const wely = document.getElementById(this.welyId)

      if (wely && Object.keys(this.events).length > 0)
        Object.keys(this.events).forEach((handler: string) =>
          wely.addEventListener(handler, this.events[handler])
        )

      this.isInitial = true
    }

    if (this.html() !== '')
      for (const child of getChildNodes(this.html()))
        this.shadowRoot.appendChild(child.cloneNode(true))
  }
}
