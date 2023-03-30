import { createUniqueId } from './generator'
import { getChildNodes } from './utils'
import { Data, DelegatedEvents, Events } from './welifyTypes'

export class WelyElement<T> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  private welyId: string = ''
  private isInitial: boolean = false
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
  }

  connectedCallback(): void {
    if (this.html !== '')
      for (const child of getChildNodes(this.html))
        this.shadowRoot.appendChild(child.cloneNode(true))

    if (!this.isInitial) {
      let startTime, endTime

      startTime = performance.now()
      for (let i = 0; i < 1000; i++) {
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
          const keys = Object.keys(this.events)

          if (keys.length > 0)
            keys.forEach((listener: string) =>
              wely.addEventListener(listener, (event: Event) =>
                this.events[listener]({ ...this.data, _event: event })
              )
            )

          if (this.delegatedEvents.length > 0)
            for (const event of this.delegatedEvents) {
              if (event.selector === '') break

              const keySet = new Set(Object.keys(event))
              keySet.delete('selector')
              const key = Array.from(keySet)[0]

              const targets = Array.from(
                this.shadowRoot.querySelectorAll(`:host > ${event.selector}`)
              )
              const listener = <(data: Data<T>, index: number) => void>(
                event[key]
              )

              if (targets.length > 0)
                targets.forEach((target, index) =>
                  target.addEventListener(key, (event: Event) =>
                    listener({ ...this.data, _event: event }, index)
                  )
                )
            }
        }
      }

      endTime = performance.now()
      console.log('Aの処理時間:', endTime - startTime)

      this.isInitial = true
    }
  }
}
