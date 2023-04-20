import { createUniqueId } from './generator'
import { appendChild, toKebabCase } from './utils'
import { Css, DelegatedEvents, Events, Values } from './welifyTypes'

export class WelyElement<T> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  readonly welyId: string = ''
  private _isInitialized: boolean = false
  name: string = ''
  descendants: WelyElement<T>[] = []
  data: T = <T>{}
  props: T = <T>{}
  html: string = ''
  classes: string[] = []
  css?: string | Css<T>
  slotContent?: string | HTMLElement[]
  events: Events<T> = {}
  delegatedEvents: DelegatedEvents<T> = []
  isEach: boolean = false

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })

    this.welyId = createUniqueId()
    this.setAttribute('id', this.welyId)
  }

  connectedCallback(): void {
    if (this.html !== '') appendChild(this.shadowRoot, this.html)

    if (this._isInitialized) return

    this.setAttribute('class', this.classes.join(' '))

    if (this.css) {
      const css = document.createElement('style')

      if (typeof this.css === 'string') css.textContent = this.css
      else {
        const styles = this.css.map(obj => {
          if (obj.selector === '') return ''

          const style = Object.entries(obj.style({ data: { ...this.data } }))
            .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
            .join('\n')

          return `${obj.selector} {${style}}`
        })

        css.textContent = styles.join('')
      }

      this.shadowRoot.appendChild(css)
    }

    if (this.slotContent) appendChild(this, this.slotContent)

    if (this) {
      const keys = Object.keys(this.events)

      if (keys.length > 0)
        for (const listener of keys) {
          const eventListener = (event: Event) =>
            this.events[listener]({ data: { ...this.data } }, event)

          this.addEventListener(listener, eventListener)
        }

      if (this.delegatedEvents.length > 0)
        for (const delegatedEvent of this.delegatedEvents) {
          if (delegatedEvent.selector === '') break

          const { selector, ...event } = delegatedEvent
          const key = Object.keys(event)[0]
          const targets = Array.from(
            this.shadowRoot.querySelectorAll(`:host > ${selector}`)
          )
          const listener = event[key] as (
            values: Values<T>,
            event: Event,
            index?: number
          ) => void

          if (targets.length > 0)
            for (let i = 0; i < targets.length; i++)
              targets[i].addEventListener(key, (localEvent: Event) =>
                listener(
                  { data: { ...this.data } },
                  localEvent,
                  this.isEach ? i : undefined
                )
              )
        }
    }

    this._isInitialized = true
  }
}
