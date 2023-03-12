import { createUniqueId } from './generator'
import { getChildNodes, toKebabCase } from './utils'

export class WelyElement extends HTMLElement {
  welyId: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = 'wely'
  html: () => string = () => ''
  classes: Array<string> = []
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
      this.setAttribute('class', toKebabCase(this.classes.join(' ')))

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

    for (const child of getChildNodes(this.html()))
      this.shadowRoot.appendChild(child.cloneNode(true))
  }
}
