import { Css, Events, Html, Inheritances } from '@/libs/types'
import { convertToArray, toKebabCase } from '@/libs/utils'

const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}
const generated: Generator<number> = generate()

export class Wely<D, P> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  readonly welyId: string = ''
  private _isInitialized: boolean = false
  private _inheritedSet: Set<string> = new Set()

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
    this.welyId = `welified-id${generated.next().value}`
  }

  connectedCallback(): void {
    if (this._isInitialized) return

    if (this.html.length > 0)
      for (let child of convertToArray(this.html)) {
        if (typeof child === 'string')
          child = <HTMLElement>(
            Array.from(
              new DOMParser().parseFromString(child, 'text/html').body.childNodes
            )[0].cloneNode(true)
          )

        this.shadowRoot.appendChild(child)
      }

    if (this.inheritances.length > 0)
      this.inheritances.forEach(inheritance => {
        const { elements } = inheritance

        for (const element of <Wely<D, P>[]>convertToArray(elements)) {
          if (this.html.includes(element))
            element.props = structuredClone(inheritance.props(this.data))
          else {
            const { welyId } = element
            element.id = welyId
            const hasWely = this._inheritedSet.has(welyId)
            const child = <Wely<D, P>>this.shadowRoot.getElementById(welyId)

            if (hasWely || child) {
              child.props = structuredClone(inheritance.props(this.data))

              if (!hasWely) this._inheritedSet.add(welyId)
            } else this._inheritedSet.delete(welyId)

            element.removeAttribute('id')
          }
        }
      })

    this.classList.add(this.classes.join(' '))

    if (this.css) {
      const css = document.createElement('style')

      if (this.css.length > 0)
        this.css.forEach(localCss => {
          if (typeof localCss === 'string') css.textContent += localCss
          else if (localCss.selector && 'style' in localCss) {
            const style = Object.entries(
              localCss.style({
                data: structuredClone(this.data),
                props: structuredClone(this.props)
              })
            )
              .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
              .join('\n')

            css.textContent += `${localCss.selector} {${style}}`
          }
        })

      this.shadowRoot.appendChild(css)
    }

    if (this.slotContent)
      typeof this.slotContent === 'string'
        ? this.insertAdjacentHTML('beforeend', this.slotContent)
        : this.insertAdjacentElement('beforeend', this.slotContent)

    if (this && this.events.length > 0) {
      for (const obj of this.events) {
        const { handler, selector, method } = obj

        if (selector) {
          const targets: Element[] = (() => {
            const createArr = (selector: string) =>
              Array.from(this.shadowRoot.querySelectorAll(`:host ${selector}`))

            if (/^.+(\.|#).+$/.test(selector)) {
              const symbol = selector.includes('.') ? '.' : '#'
              const [tag, attr] = selector.split(symbol)

              return createArr(tag).filter(
                element => element.getAttribute(symbol === '.' ? 'class' : 'id') === attr
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
                  {
                    data: structuredClone(this.data),
                    props: structuredClone(this.props)
                  },
                  event,
                  this.isEach ? i : undefined
                )
              )
        } else
          this.addEventListener(handler, (event: Event) =>
            method(
              {
                data: structuredClone(this.data),
                props: structuredClone(this.props)
              },
              event
            )
          )
      }
    }

    this._isInitialized = true
  }
}
