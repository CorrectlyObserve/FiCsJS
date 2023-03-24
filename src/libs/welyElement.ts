import { createUniqueId } from './generator'
import { getChildNodes } from './utils'
import { Data, DelegatedEvents, EventListener, Events } from './welifyTypes'

export class WelyElement<T> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  private welyId: string = ''
  private isInitial: boolean = false
  private templateId: string
  private template: HTMLTemplateElement = document.createElement('template')
  name: string = ''
  data: Data<T> = {}
  html: string = ''
  classes: string[] = []
  css?: string
  slotContent?: string
  events: Events<T> = {}
  delegatedEvents: DelegatedEvents<T> = []

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })

    this.welyId = createUniqueId()
    this.setAttribute('id', this.welyId)

    this.templateId = `${this.welyId}-template`
    this.template.setAttribute('id', this.templateId)
    this.template.setAttribute('style', 'display:block')
  }

  connectedCallback(): void {
    if (this.html !== '')
      for (const child of getChildNodes(this.html))
        this.template.appendChild(child.cloneNode(true))

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

      if (wely) {
        if (Object.keys(this.events).length > 0)
          Object.keys(this.events).forEach((listener: string) =>
            wely.addEventListener(listener, () =>
              this.events[listener](this.data)
            )
          )

        if (this.delegatedEvents.length > 0)
          for (const event of this.delegatedEvents) {
            if (event.selector === '') break

            const keys = new Set(Object.keys(event))
            keys.delete('selector')
            const key = Array.from(keys)[0]

            const targets = Array.from(
              this.template.querySelectorAll(
                `#${this.templateId} > ${event.selector}`
              )
            )

            const listener = <EventListener<T>>event[key]

            if (targets.length > 0)
              targets.forEach((target) =>
                target.addEventListener(key, () => listener(this.data))
              )
          }
      }

      this.isInitial = true
    }

    this.shadowRoot.appendChild(this.template)
  }
}
