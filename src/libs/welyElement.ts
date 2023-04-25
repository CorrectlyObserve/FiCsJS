import { appendChild, toKebabCase } from './utils'
import { Args, Css, DelegatedEvents, Events, Inheritances } from './welifyTypes'

export class WelyElement<D, P> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  private _isInitialized: boolean = false
  private _inheritedSet: Set<string> = new Set()

  name: string = ''
  data: D = <D>{}
  props: P = <P>{}
  inheritances: Inheritances<D, P> = []
  classes: string[] = []
  html: string = ''
  css?: string | Css<D, P>
  slotContent?: string | HTMLElement[]
  events: Events<D, P> = {}
  delegatedEvents: DelegatedEvents<D, P> = []
  isEach: boolean = false

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    if (this.html !== '') appendChild(this.shadowRoot, this.html)

    if (this._isInitialized) return

    this.setAttribute('id', this.name)

    if (this.inheritances.length > 0)
      this.inheritances.forEach(inheritance => {
        if (Array.isArray(inheritance.elements)) {
          inheritance.elements.forEach(element => {
            const name = element.name

            const welyChild = this.shadowRoot.querySelector(
              `#${name}`
            ) as WelyElement<D, P>

            if (welyChild) {
              welyChild.props = { ...inheritance.props } as P
              console.log(welyChild.props)
            }

            if (this.shadowRoot.querySelector(`#${name}`))
              this._inheritedSet.add(name)
          })
        } else {
          const name = inheritance.elements.name

          if (this.shadowRoot.querySelector(`#${name}`))
            this._inheritedSet.add(name)
        }
      })

    this.setAttribute('class', this.classes.join(' '))

    if (this.css) {
      const css = document.createElement('style')

      if (typeof this.css === 'string') css.textContent = this.css
      else {
        const styles = this.css.map(obj => {
          if (obj.selector === '') return ''

          const style = Object.entries(
            obj.style({ data: { ...this.data }, props: { ...this.props } })
          )
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
            values: Args<D, P>,
            event: Event,
            index?: number
          ) => void

          if (targets.length > 0)
            for (let i = 0; i < targets.length; i++)
              targets[i].addEventListener(key, (localEvent: Event) =>
                listener(
                  { data: { ...this.data }, props: { ...this.props } },
                  localEvent,
                  this.isEach ? i : undefined
                )
              )
        }
    }

    this._isInitialized = true
  }
}
