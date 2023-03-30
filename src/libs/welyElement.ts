import { createUniqueId } from './generator'
import { getChildNodes } from './utils'
import { Data, DelegatedEvents, Events } from './welifyTypes'

export class WelyElement<T> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  private _id: string = ''
  private _isInitialized: boolean = false
  name: string = ''
  data: Data<T> = {}
  html: string = ''
  classes: string[] = []
  css?: string
  slotContent?: string
  events: Events<T> = {}
  delegatedEvents: DelegatedEvents<T> = []
  isEach: boolean = false

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })

    this._id = createUniqueId()
    this.setAttribute('id', this._id)
  }

  connectedCallback(): void {
    if (this.html !== '')
      for (const child of getChildNodes(this.html))
        this.shadowRoot.appendChild(child.cloneNode(true))

    if (this._isInitialized) return

    this.setAttribute('class', this.classes.join(' '))

    if (this.css) {
      const css = document.createElement('style')
      css.textContent = this.css
      this.shadowRoot.appendChild(css)
    }

    if (this.slotContent) this.insertAdjacentHTML('beforeend', this.slotContent)

    const wely = document.getElementById(this._id)
    if (wely) {
      const keys = Object.keys(this.events)

      if (keys.length > 0)
        keys.forEach((listener: string) =>
          wely.addEventListener(listener, (event: Event) =>
            this.events[listener]({ ...this.data }, event)
          )
        )

      if (this.delegatedEvents.length > 0)
        for (const event of this.delegatedEvents) {
          if (event.selector === '') break

          const keySet = new Set(Object.keys(event))
          new Set(Object.keys(event)).delete('selector')
          const key = Array.from(keySet)[0]

          let startTime, endTime

          startTime = performance.now()
          for (let i = 0; i < 10000; i++) {
            Array.from(
              this.shadowRoot.querySelectorAll(`:host > ${event.selector}`)
            )
          }
          endTime = performance.now()
          console.log('Aの処理時間:', endTime - startTime, this._isInitialized)

          const targets = Array.from(
            this.shadowRoot.querySelectorAll(`:host > ${event.selector}`)
          )
          const listener = event[key] as (
            data: Data<T>,
            event: Event,
            index?: number
          ) => void

          if (targets.length > 0)
            targets.forEach((target, index) =>
              target.addEventListener(key, (event: Event) =>
                listener(
                  { ...this.data },
                  event,
                  this.isEach ? index : undefined
                )
              )
            )
        }
    }

    this._isInitialized = true
  }
}
