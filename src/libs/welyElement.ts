import { createUniqueId } from './generator'
import { getChildNodes } from './utils'
import { Data } from './welifyTypes'

export class WelyElement<U> extends HTMLElement {
  welyId: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = ''
  data: Data<U> = {}
  html: string = ''
  classes: string[] = []
  css?: string
  slotContent?: string
  events: {
    [key: string]: (data: Data<U>) => void
  } = {}

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
      const keys = Object.keys(this.events)

      if (wely && keys.length > 0)
        keys.forEach((handler: string) =>
          wely.addEventListener(handler, () => this.events[handler](this.data))
        )

      this.isInitial = true
    }

    if (this.html !== '')
      for (const child of getChildNodes(this.html))
        this.shadowRoot.appendChild(child.cloneNode(true))
  }
}
