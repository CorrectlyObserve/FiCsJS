import { Css, Each, EachIf, Events, Html, If, Inheritances, Initialize } from '@/libs/types'
import { toKebabCase } from '@/libs/utils'

const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}
const generated: Generator<number> = generate()

export class Wely<T, D, P> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  readonly welyId: string = ''

  #data: D = <D>{}
  #props: P = <P>{}
  #inheritances: Inheritances<D, P> = []
  #classes: string[] = []
  #html: Html[] = []
  #css?: Css<D, P>
  #slotContent?: string | HTMLElement
  #events: Events<D, P> = []

  #isEach: boolean = false
  #isRendered: boolean = false
  #inheritedSet: Set<HTMLElement> = new Set()

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })
    this.welyId = `welified-id${generated.next().value}`
  }

  initialize({
    name,
    dataObj,
    inheritances,
    className,
    html,
    css,
    slot,
    events
  }: Initialize<T, D, P>) {
    if (dataObj) this.#data = { ...dataObj }
    if (inheritances) this.#inheritances = [...inheritances]

    this.#classes.push(toKebabCase(name))
    if (className)
      for (const localName of className.split(' '))
        this.#classes.push(toKebabCase(localName).trim())

    let converter =
      typeof html === 'function'
        ? html({ data: { ...this.#data }, props: { ...this.#props } })
        : html

    if (
      typeof converter === 'string' ||
      converter instanceof HTMLElement ||
      converter instanceof DocumentFragment
    )
      this.#html.push(converter)
    else if ('contents' in <Each<T> | EachIf<T>>converter) {
      this.#isEach = true

      if ('branches' in <EachIf<T>>converter)
        (<EachIf<T>>converter).contents.forEach((content, index) => {
          for (const branch of (<EachIf<T>>converter).branches)
            if (branch.judge(content)) this.#html.push(branch.render(content, index))

          const fallback = (<EachIf<T>>converter)?.fallback
          if (fallback !== undefined) this.#html.push(fallback(content, index))
        })
      else
        (<Each<T>>converter).contents.forEach((content, index) =>
          this.#html.push((<Each<T>>converter).render(content, index) ?? '')
        )
    } else if ('branches' in <If>converter) {
      for (const branch of (<If>converter).branches)
        if (branch.judge) {
          this.#html.push(branch.render)
          break
        }

      const fallback = (<If>converter)?.fallback
      if (this.#html.length === 0 && fallback) this.#html.push(fallback)
    }

    if (css) this.#css = [...css]
    if (slot)
      this.#slotContent =
        typeof slot === 'function'
          ? slot({ data: { ...this.#data }, props: { ...this.#props } })
          : slot

    if (events) this.#events = [...events]
  }

  connectedCallback(): void {
    if (this.#isRendered) return

    if (this.#html.length > 0) {
      if (typeof this.#html[0] === 'string') {
        const childNodes = Array.from(
          new DOMParser().parseFromString(this.#html[0], 'text/html').body.childNodes
        )
        childNodes.forEach(childNode => this.shadowRoot.appendChild(childNode))
      } else this.shadowRoot.appendChild(<Node>this.#html[0])
    }

    if (this.#inheritances.length > 0)
      this.#inheritances.forEach(inheritance => {
        let { descendants } = inheritance
        if (!Array.isArray(descendants)) descendants = [descendants]

        for (const descendant of <Wely<T, D, P>[]>descendants) {
          if (this.#html.includes(descendant) || this.#inheritedSet.has(descendant))
            descendant.#props = { ...inheritance.props(this.#data) }
          else {
            const { welyId } = descendant
            descendant.id = welyId
            let element: Wely<T, D, P> | undefined = <Wely<T, D, P>>(
              this.shadowRoot.getElementById(welyId)
            )
            descendant.removeAttribute('id')

            if (!element) {
              let { boundary } = inheritance
              const boundaries: Set<HTMLElement> = new Set([this])

              if (typeof boundary === 'string')
                boundary = <HTMLElement>document.getElementById(boundary)
              if (boundary) boundaries.add(boundary)

              const getParent = (argElement: HTMLElement): void => {
                if (argElement instanceof ShadowRoot) {
                  const parent = <Wely<T, D, P>>(<ShadowRoot>argElement).host

                  if (parent) boundaries.has(parent) ? (element = descendant) : getParent(parent)
                } else if (argElement instanceof HTMLElement)
                  getParent(<HTMLElement>argElement.parentNode)
              }

              getParent(<HTMLElement>descendant.parentNode)
            }

            if (element) {
              element.#props = { ...inheritance.props(this.#data) }
              this.#inheritedSet.add(element)
            } else {
              if (this.#inheritedSet.has(descendant)) this.#inheritedSet.delete(descendant)
              throw Error(`This component is not a descendant...`)
            }
          }
        }
      })

    this.classList.add(this.#classes.join(' '))

    if (this.#css) {
      const css = document.createElement('style')

      if (this.#css.length > 0)
        this.#css.forEach(localCss => {
          if (typeof localCss === 'string') css.textContent += localCss
          else if (localCss.selector && 'style' in localCss) {
            const style = Object.entries(
              localCss.style({ data: { ...this.#data }, props: { ...this.#props } })
            )
              .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
              .join('\n')

            css.textContent += `${localCss.selector} {${style}}`
          }
        })

      this.shadowRoot.appendChild(css)
    }

    if (this.#slotContent)
      typeof this.#slotContent === 'string'
        ? this.insertAdjacentHTML('beforeend', this.#slotContent)
        : this.insertAdjacentElement('beforeend', this.#slotContent)

    if (this && this.#events.length > 0) {
      for (const obj of this.#events) {
        const { selector, handler, method } = obj

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
                  { data: { ...this.#data }, props: { ...this.#props } },
                  event,
                  this.#isEach ? i : undefined
                )
              )
        } else
          this.addEventListener(handler, (event: Event) =>
            method({ data: { ...this.#data }, props: { ...this.#props } }, event)
          )
      }
    }

    this.#isRendered = true
  }
}
