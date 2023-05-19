import { createUniqueId } from '@/libs/generator'
import { appendChild, toKebabCase } from '@/libs/utils'
import {
  Args,
  Css,
  DelegatedEvents,
  Events,
  Html,
  Inheritances
} from '@/libs/types'

export class Wely<D, P> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  private _welyId: string = ''
  private _isInitialized: boolean = false
  private _inheritedSet: Set<string> = new Set()

  name: string = ''
  data: D = <D>{}
  props: P = <P>{}
  inheritances: Inheritances<D, P> = []
  classes: string[] = []
  html: Html[] = []
  css?: Css<D, P>
  slotContent?: Html
  events: Events<D, P> = {}
  delegatedEvents: DelegatedEvents<D, P> = []
  isEach: boolean = false

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })
    this._welyId = createUniqueId()
  }

  connectedCallback(): void {
    if (this.html.length > 0) appendChild(this.shadowRoot, this.html)

    if (this._isInitialized) return

    if (this.inheritances.length > 0)
      this.inheritances.forEach(inheritance => {
        const { elements, props } = inheritance

        for (let element of elements as Wely<D, P>[]) {
          element.setAttribute('id', this._welyId)

          if (
            this._inheritedSet.has(element.id) ||
            this.shadowRoot.querySelector(`#${element.id}`)
          ) {
            const child = this.shadowRoot.querySelector(
              `#${element.id}`
            ) as Wely<D, P>

            child.props = { ...props(this.data) }

            if (!this._inheritedSet.has(element.id))
              this._inheritedSet.add(element.id)
          } else this._inheritedSet.delete(element.id)

          element.removeAttribute('id')
        }
      })

    this.setAttribute('class', this.classes.join(' '))

    if (this.css) {
      const css = document.createElement('style')

      if (typeof this.css === 'string') css.textContent = this.css
      else if (Array.isArray(this.css) && this.css.length > 0)
        this.css.forEach(async localCss => {
          if (typeof localCss === 'string') {
            if (!(localCss as string).endsWith('.css'))
              throw new Error('The file does not appear to be a CSS file.')

            try {
              const res = await fetch(localCss)
              console.log(await res.text())

              if (res.status === 200) css.textContent += await res.text()
              else throw new Error(`${res.status} ${res.statusText}`)
            } catch (error) {
              throw new Error(
                error instanceof Error ? error.message : error?.toString()
              )
            }
          } else if (localCss.selector && 'style' in localCss) {
            const style = Object.entries(
              localCss.style({
                data: { ...this.data },
                props: { ...this.props }
              })
            )
              .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
              .join('\n')

            css.textContent += `${localCss.selector} {${style}}`
          }
        })

      this.shadowRoot.appendChild(css)
    }

    if (this.slotContent) appendChild(this, [this.slotContent])

    if (this) {
      const keys = Object.keys(this.events)

      if (keys.length > 0)
        for (const listener of keys)
          this.addEventListener(listener, (event: Event) =>
            this.events[listener](
              { data: { ...this.data }, props: { ...this.props } },
              event
            )
          )

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
