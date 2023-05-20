import { Css, Events, Html, Inheritances } from '@/libs/types'
import { appendChild, toKebabCase } from '@/libs/utils'

const generate = function* (): Generator<number> {
  let i = 1

  while (true) {
    yield i
    i++
  }
}

const generated: Generator<number> = generate()

export class Wely<D, P> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
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
  events: Events<D, P> = []
  isEach: boolean = false

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })
    this.setAttribute('id', `welified-id${generated.next().value}`)
  }

  connectedCallback(): void {
    if (this.html.length > 0) appendChild(this.shadowRoot, this.html)

    if (this._isInitialized) return

    if (this.inheritances.length > 0)
      this.inheritances.forEach(inheritance => {
        const { elements, props } = inheritance

        for (let element of elements as Wely<D, P>[])
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

    if (this && this.events.length > 0) {
      for (const obj of this.events) {
        const { handler, selector, method } = obj

        if (selector) {
          const targets: Element[] = (() => {
            const createArr = (selector: string) =>
              Array.from(this.shadowRoot.querySelectorAll(`:host ${selector}`))

            if (/^.+(.|#).+$/.test(selector)) {
              const symbol = selector.includes('.') ? '.' : '#'
              const [tag, attr] = selector.split(symbol)

              return createArr(tag).filter(
                element =>
                  element.getAttribute(symbol === '.' ? 'class' : 'id') === attr
              )
            }

            return createArr(selector)
          })()

          if (targets.length === 0)
            throw Error(`The element does not exist or is not applicable...`)
          else
            for (let i = 0; i < targets.length; i++)
              targets[i].addEventListener(handler, (event: Event) =>
                method(
                  { data: { ...this.data }, props: { ...this.props } },
                  event,
                  this.isEach ? i : undefined
                )
              )
        } else
          this.addEventListener(handler, (event: Event) =>
            method({ data: { ...this.data }, props: { ...this.props } }, event)
          )
      }
    }

    this._isInitialized = true
  }
}
