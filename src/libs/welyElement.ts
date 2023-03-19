import { createUniqueId } from './generator'
import { getChildNodes } from './utils'
import { Data } from './Types'

export class Element<T> extends HTMLElement {
  Id: string = ''
  readonly shadowRoot!: ShadowRoot
  private isInitial: boolean = false
  name: string = ''
  data: Data<T> = {}
  html: string = ''
  classes: string[] = []
  css?: string
  slotContent?: string
  events: {
    [key: string]: (data: Data<T>) => void
  } = {}

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
      const keys = Object.keys(this.events)

      if ( && keys.length > 0)
        keys.forEach((handler: string) =>
          .addEventListener(handler, this.events[handler](this.data))
        )

      this.isInitial = true
    }

    if (this.html !== '')
      for (const child of getChildNodes(this.html))
        this.shadowRoot.appendChild(child.cloneNode(true))
  }
}
