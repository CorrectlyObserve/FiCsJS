import { createUniqueId } from './generator'
import { appendChild, toKebabCase } from './utils'
import { Css, DelegatedEvents, Events } from './welifyTypes'

export class WelyElement<T> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  private _id: string = ''
  private _isInitialized: boolean = false
  name: string = ''
  data: T = <T>{}
  html: string = ''
  classes: string[] = []
  css?: string | Css<T>
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
    if (this.html !== '') appendChild(this.shadowRoot, this.html)

    if (this._isInitialized) return

    this.setAttribute('class', this.classes.join(' '))

    if (this.css) {
      const css = document.createElement('style')

      if (typeof this.css === 'string') css.textContent = this.css
      else {
        const styles = this.css.map(obj => {
          if (obj.selector === '') return ''

          const style = Object.entries(obj.style(this.data))
            .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
            .join('\n')

          return `${obj.selector} {${style}}`
        })

        css.textContent = styles.join('')
      }

      this.shadowRoot.appendChild(css)

      let startTime, endTime

      startTime = performance.now()
      if (typeof this.css !== 'string') {
        for (let i = 0; i < 10000; i++) {
          const styles = this.css.map(obj => {
            if (obj.selector === '') return ''

            const style = Object.entries(obj.style(this.data))
              .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
              .join('\n')

            return `${obj.selector} {${style}}`
          })

          css.textContent = styles.join('')
        }
      }

      endTime = performance.now()
      console.log('css-in-jsの処理時間:', endTime - startTime)
    }

    if (this.slotContent) this.insertAdjacentHTML('beforeend', this.slotContent)

    const wely = document.getElementById(this._id)
    if (wely) {
      const keys = Object.keys(this.events)

      if (keys.length > 0)
        for (const listener of keys) {
          const eventListener = (event: Event) =>
            this.events[listener]({ ...this.data }, event)

          wely.addEventListener(listener, eventListener)
        }

      if (this.delegatedEvents.length > 0)
        for (const delegatedEvent of this.delegatedEvents) {
          if (delegatedEvent.selector === '') break

          const { selector, ...event } = delegatedEvent
          const key = Object.keys(event)[0]

          let startTime, endTime

          startTime = performance.now()
          for (let i = 0; i < 10000; i++) {
            Array.from(this.shadowRoot.querySelectorAll(`:host > ${selector}`))
          }
          endTime = performance.now()
          console.log('delegatedEventsの処理時間:', endTime - startTime)

          const targets = Array.from(
            this.shadowRoot.querySelectorAll(`:host > ${selector}`)
          )
          const listener = event[key] as (
            data: T,
            event: Event,
            index?: number
          ) => void

          if (targets.length > 0)
            for (let i = 0; i < targets.length; i++)
              targets[i].addEventListener(key, (localEvent: Event) =>
                listener(
                  { ...this.data },
                  localEvent,
                  this.isEach ? i : undefined
                )
              )
        }
    }

    this._isInitialized = true
  }
}
