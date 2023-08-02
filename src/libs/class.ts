import { Each, EachIf, Html, If, Initialize } from '@/libs/types'
import { generator, insertElement, toKebabCase } from '@/libs/utils'

export class WelyElement<T, D, P> extends HTMLElement {
  readonly shadowRoot!: ShadowRoot
  readonly welyId: string = ''

  #data: D = <D>{}
  #props: P = <P>{}
  #html: Html[] = []
  #inheritedSet: Set<HTMLElement> = new Set()

  constructor() {
    super()
    this.shadowRoot = this.attachShadow({ mode: 'open' })
    this.welyId = `wely-id${generator.next().value}`
  }

  initialize({
    name,
    integratedData,
    inheritances,
    className,
    html,
    css,
    slot,
    events
  }: Initialize<T, D, P>) {
    // Class name
    let welyClass: string = toKebabCase(name)
    if (className)
      for (const localName of className.split(' ')) welyClass += ` ${toKebabCase(localName).trim()}`
    this.setAttribute('class', welyClass)

    // Data
    if (integratedData) this.#data = { ...integratedData }

    // HTML
    let converter =
      typeof html === 'function'
        ? html({ data: { ...this.#data }, props: { ...this.#props } })
        : html
    let isEach: boolean = false

    if (
      typeof converter === 'string' ||
      converter instanceof HTMLElement ||
      converter instanceof DocumentFragment
    )
      this.#html.push(converter)
    else if ('contents' in <Each<T> | EachIf<T>>converter) {
      isEach = true

      if ('branches' in <EachIf<T>>converter)
        (<EachIf<T>>converter).contents.forEach((content, index) => {
          for (const branch of (<EachIf<T>>converter).branches)
            if (branch.judge(content)) this.#html.push(branch.render(content, index))

          const fallback = (<EachIf<T>>converter)?.fallback
          if (fallback) this.#html.push(fallback(content, index))
        })
      else
        (<Each<T>>converter).contents.forEach((content, index) => {
          const render = (<Each<T>>converter).render(content, index)
          if (render) this.#html.push(render)
        })
    } else if ('branches' in <If>converter) {
      for (const branch of (<If>converter).branches)
        if (branch.judge) this.#html.push(branch.render)

      const fallback = (<If>converter)?.fallback
      if (this.#html.length === 0 && fallback) this.#html.push(fallback)
    }

    if (this.#html.length > 0)
      for (const element of this.#html)
        if (typeof element === 'string')
          Array.from(new DOMParser().parseFromString(element, 'text/html').body.childNodes).forEach(
            childNode => this.shadowRoot.appendChild(childNode)
          )
        else this.shadowRoot.appendChild(<Node>element)

    // Props
    if (inheritances)
      inheritances.forEach(inheritance => {
        const { descendants } = inheritance

        for (const descendant of <WelyElement<T, D, P>[]>(
          (Array.isArray(descendants) ? descendants : [descendants])
        )) {
          let isDescendant: boolean =
            this.#html.includes(descendant) || this.#inheritedSet.has(descendant)

          if (!isDescendant) {
            const { boundary } = inheritance
            const boundaries: Set<HTMLElement> = new Set([this])

            if (boundary)
              boundaries.add(
                typeof boundary === 'string'
                  ? <HTMLElement>document.getElementById(boundary)
                  : boundary
              )

            const getParent = (argElement: HTMLElement): void => {
              if (argElement instanceof ShadowRoot) {
                const parent = <WelyElement<T, D, P>>(<ShadowRoot>argElement).host

                if (parent) boundaries.has(parent) ? (isDescendant = true) : getParent(parent)
              } else if (argElement instanceof HTMLElement)
                getParent(<HTMLElement>argElement.parentNode)
            }

            getParent(<HTMLElement>descendant.parentNode)
          }

          if (isDescendant) {
            descendant.#props = { ...inheritance.props(this.#data) }
            this.#inheritedSet.add(descendant)
          } else {
            if (this.#inheritedSet.has(descendant)) this.#inheritedSet.delete(descendant)
            throw Error(`This component is not a descendant...`)
          }
        }
      })

    // CSS
    if (css && css.length > 0) {
      const style = document.createElement('style')

      css.forEach(cssObj => {
        if (typeof cssObj === 'string') style.textContent += cssObj
        else if (cssObj.selector && 'style' in cssObj)
          style.textContent +=
            cssObj.selector +
            `{${Object.entries(cssObj.style({ data: { ...this.#data }, props: { ...this.#props } }))
              .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
              .join('\n')}}`
      })

      this.shadowRoot.appendChild(style)
    }

    // Slot
    if (slot)
      insertElement(
        this,
        typeof slot === 'function'
          ? slot({ data: { ...this.#data }, props: { ...this.#props } })
          : slot
      )

    // Event handlers
    if (events) {
      for (const eventObj of events) {
        const { selector, handler, method } = eventObj

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
                  isEach ? i : undefined
                )
              )
        } else
          this.addEventListener(handler, (event: Event) =>
            method({ data: { ...this.#data }, props: { ...this.#props } }, event)
          )
      }
    }
  }
}
