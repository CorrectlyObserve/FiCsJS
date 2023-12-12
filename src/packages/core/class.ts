import generate from './generator'
import symbol from './symbol'
import {
  Class,
  Css,
  Events,
  Html,
  Props,
  PropsChain,
  Reflections,
  Sanitized,
  Slot,
  UpdatePropsTrees,
  Wely
} from './types'

const generator: Generator<number> = generate()

export default class WelyElement<D extends object, P extends object> {
  readonly #reservedWords: string[] = ['slot']
  readonly #welyId: string
  readonly #name: string
  readonly #data: D = <D>{}
  readonly #inheritances: Props<D> = []
  readonly #props: P = <P>{}
  readonly #isOnlyCsr: boolean = false
  readonly #class: Class<D, P> | undefined = undefined
  readonly #html: Html<D, P> = { [symbol]: [] }
  readonly #slot: Slot<D, P> | undefined = undefined
  readonly #css: Css<D, P> = []
  readonly #events: Events<D, P> = []
  readonly #reflections: Reflections<D> | undefined = undefined

  readonly #propsTrees: {
    descendantId: string
    dataKey: string
    propsKey: keyof P
    setProps: (value: P[keyof P]) => void
  }[] = []
  readonly #dataBindings: { class: boolean; html: boolean; css: number[]; events: number[] } = {
    class: false,
    html: false,
    css: [],
    events: []
  }

  #propsChain: PropsChain<P> = new Map()
  #updatePropsTrees: UpdatePropsTrees<P> = []
  #component: HTMLElement | undefined = undefined

  constructor({
    welyId,
    name,
    data,
    props,
    isOnlyCsr,
    className,
    html,
    slot,
    css,
    events,
    reflections
  }: Wely<D, P>) {
    if (welyId && !this.#reservedWords.includes(welyId) && this.#reservedWords.includes(name))
      throw Error(`${name} is a reserved word in WelyJS...`)
    else {
      this.#welyId = welyId ?? `wely${generator.next().value}`
      this.#name = name

      if (data) {
        if (reflections) {
          let hasError = false

          for (const key of Object.keys(reflections)) {
            if (key in data()) continue

            if (!hasError) hasError = true
            throw Error(`${key} is not defined in data...`)
          }

          if (!hasError) this.#reflections = { ...reflections }
        }

        for (const [key, value] of Object.entries(data())) this.#data[key as keyof D] = value
      }

      if (props && props.length > 0) this.#inheritances = [...props]

      if (isOnlyCsr) this.#isOnlyCsr = true
      if (className) this.#class = className

      this.#html = typeof html === 'function' ? html : { ...html }
      if (slot) this.#slot = Array.isArray(slot) ? [...slot] : slot

      if (css && css.length > 0) this.#css = [...css]
      if (events && events.length > 0) this.#events = [...events]
    }
  }

  #clone(
    { welyId, data }: { welyId?: string; data?: () => D } = {
      welyId: this.#welyId,
      data: () => this.#data
    }
  ): WelyElement<D, P> {
    return new WelyElement<D, P>({
      welyId,
      name: this.#name,
      data,
      props: this.#inheritances,
      isOnlyCsr: this.#isOnlyCsr,
      className: this.#class,
      html: this.#html,
      slot: Array.isArray(this.#slot) ? [...this.#slot] : this.#slot,
      css: this.#css,
      events: this.#events,
      reflections: this.#reflections
    })
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (!(key in this.#props)) throw Error(`${key as string} is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      console.log('props', key, this.#props[key])
    }
  }

  #initializeProps(propsChain: PropsChain<P>, updatePropsTrees: UpdatePropsTrees<P>): void {
    if (this.#inheritances.length > 0)
      for (const { descendants, values } of this.#inheritances)
        for (const descendant of Array.isArray(descendants) ? descendants : [descendants]) {
          let dataKey: string = ''
          const data: [string, P][] = Object.entries({
            ...values((key: keyof D) => {
              dataKey = <string>key
              return this.getData(key)
            })
          })
          const descendantId: string = descendant.#welyId

          for (const [key, value] of data) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (!(key in chain) || !propsChain.has(descendantId)) {
              propsChain.set(descendantId, { ...chain, [key]: value })

              const propsKey = key as keyof P

              this.#propsTrees.push({
                descendantId,
                dataKey,
                propsKey,
                setProps: (value: P[keyof P]) => descendant.#setProps(propsKey, value)
              })

              updatePropsTrees.push({
                descendantId,
                propsKey,
                updateSetProps: (setProps: (value: P[keyof P]) => void) => {
                  for (const tree of this.#propsTrees)
                    if (tree.descendantId === descendantId && tree.propsKey === propsKey)
                      tree.setProps = (value: P[keyof P]) => setProps(value)
                    else continue
                }
              })
            } else continue
          }
        }

    this.#propsChain = new Map(propsChain)
    this.#updatePropsTrees = [...updatePropsTrees]

    for (const [key, value] of Object.entries(this.#propsChain.get(this.#welyId) ?? {})) {
      const propsKey = key as keyof P

      this.#props[propsKey] = value as P[keyof P]

      for (const tree of this.#updatePropsTrees)
        if (tree.descendantId === this.#welyId && tree.propsKey === propsKey)
          tree.updateSetProps(value => this.#setProps(propsKey, value))
        else continue
    }
  }

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #addClass(wely?: HTMLElement): string | void {
    const name = this.#toKebabCase(this.#name)

    if (this.#class) {
      if (typeof this.#class === 'function') this.#dataBindings.class = true

      const className = `${name} ${
        typeof this.#class === 'function'
          ? this.#class({ data: { ...this.#data }, props: { ...this.#props } })
          : this.#class
      }`

      if (!wely) return className
      wely.setAttribute('class', className)
    } else {
      if (!wely) return name
      wely.classList.add(name)
    }
  }

  #convertHtml(html: Html<D, P>): Sanitized<D, P> | undefined {
    return typeof html === 'function'
      ? html({ data: { ...this.#data }, props: { ...this.#props } })[symbol]
      : html[symbol]
  }

  #getTagName(): string {
    return `w-${this.#toKebabCase(this.#name)}`
  }

  #getSlot(slotName: string): Html<D, P> | undefined {
    if (Array.isArray(this.#slot)) {
      const slot = this.#slot.find(slot =>
        slotName === ''
          ? !('name' in slot && 'contents' in slot)
          : 'name' in slot && 'contents' in slot && slot.name === slotName
      )

      return slot && 'name' in slot && 'contents' in slot ? slot.contents : slot
    }

    return this.#slot
  }

  #renderOnServer(propsChain: PropsChain<P>): string {
    const that: WelyElement<D, P> = this.#clone()
    const tagName: string = that.#getTagName()

    if (that.#isOnlyCsr) return `<${tagName}></${tagName}>`

    that.#initializeProps(propsChain, [])

    const addHtml = (html: Html<D, P>): string => {
      const elements = that.#convertHtml(html)
      const name = that.#name

      if (elements) return <string>elements.reduce((prev, curr) => {
          if (curr instanceof WelyElement && curr.#getTagName() === 'w-slot') {
            if (that.#slot) {
              const slotName: string | WelyElement<D, P> = that.#convertHtml(curr.#html)?.[0] ?? ''
              const slot: Html<D, P> | undefined = that.#getSlot(<string>slotName)

              if (slot) return prev + addHtml(slot)

              throw Error(`${name} has no ${slotName === '' ? 'unnamed' : slotName} slot...`)
            } else throw Error(`${name} has no slot contents...`)
          } else
            return (
              prev + (curr instanceof WelyElement ? curr.#renderOnServer(that.#propsChain) : curr)
            )
        }, '')

      throw Error(`${name} has to use html function (tagged template literal) in html argument.`)
    }

    return `
        <${tagName} class="${that.#addClass()}">
          <template shadowroot="open"><slot></slot>${that.#addCss() ?? ''}</template>
          ${addHtml(that.#html)}
        </${tagName}>
      `.trim()
  }

  #addHtml(shadowRoot: ShadowRoot, html: Html<D, P> = this.#html): void {
    const elements: Sanitized<D, P> | undefined = this.#convertHtml(html)

    this.#dataBindings.html =
      typeof html === 'function' ||
      (Array.isArray(this.#slot)
        ? this.#slot.some(
            slot =>
              typeof ('name' in slot && 'contents' in slot ? slot.contents : slot) === 'function'
          )
        : typeof this.#slot === 'function')

    if (elements)
      for (const element of elements) {
        if (element instanceof WelyElement && element.#getTagName() === 'w-slot') {
          if (this.#slot) {
            const slotName: string | WelyElement<D, P> = this.#convertHtml(element.#html)?.[0] ?? ''
            const slot: Html<D, P> | undefined = this.#getSlot(<string>slotName)

            if (slot) this.#addHtml(shadowRoot, slot)
            else
              throw Error(`${this.#name} has no ${slotName === '' ? 'unnamed' : slotName} slot...`)
          } else throw Error(`${this.#name} has no slot contents...`)
        } else
          shadowRoot.appendChild(
            element instanceof WelyElement
              ? element.#component ?? element.#render(this.#propsChain, this.#updatePropsTrees)
              : document.createRange().createContextualFragment(element)
          )
      }
    else
      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
  }

  #addCss(shadowRoot?: ShadowRoot | null): string | void {
    if (this.#css.length > 0) {
      const style = this.#css.reduce((prev, curr, index) => {
        if (typeof curr !== 'string' && curr.selector && 'style' in curr) {
          if (typeof curr.style === 'function') this.#dataBindings.css.push(index)

          const styleContent = Object.entries(
            typeof curr.style === 'function'
              ? curr.style({ data: { ...this.#data }, props: { ...this.#props } })
              : curr.style
          )
            .map(([key, value]) => `${this.#toKebabCase(key)}: ${value};`)
            .join('\n')

          return `${prev}${curr.selector}{${styleContent}}`
        }

        return `${prev}${curr}`
      }, '')

      if (!shadowRoot) return `<style>${style}</style>`

      const stylesheet: CSSStyleSheet = new CSSStyleSheet()
      shadowRoot.adoptedStyleSheets = [stylesheet]
      stylesheet.replace(<string>style)
    }
  }

  #getShadowRoot(wely: HTMLElement): ShadowRoot {
    if (wely.shadowRoot) return wely.shadowRoot

    throw Error(`${this.#name} does not have a shadowRoot...`)
  }

  #addEvents(wely: HTMLElement): void {
    if (this.#events.length > 0)
      this.#events.forEach((event, index) => {
        const { selector, handler, method } = event

        if (selector) {
          this.#dataBindings.events.push(index)

          const elements: Element[] = []
          const getSelectors = (selector: string): Element[] =>
            Array.from((<ShadowRoot>wely.shadowRoot).querySelectorAll(`:host ${selector}`))

          if (/^.+(\.|#).+$/.test(selector)) {
            const prefix = selector.includes('.') ? '.' : '#'
            const [tag, attr] = selector.split(prefix)

            elements.push(
              ...getSelectors(tag).filter(
                element => element.getAttribute(prefix === '.' ? 'class' : 'id') === attr
              )
            )
          } else elements.push(...getSelectors(selector))

          if (elements.length > 0)
            for (const element of elements)
              element.addEventListener(handler, (event: Event) =>
                method(
                  {
                    data: { ...this.#data },
                    setData: (key: keyof D, value: D[typeof key]) => this.setData(key, value),
                    props: { ...this.#props }
                  },
                  event
                )
              )
          else
            console.error(
              `:host ${selector} does not exist or is not applicable in ${this.#name}...`
            )
        } else
          wely.addEventListener(handler, (event: Event) =>
            method(
              {
                data: { ...this.#data },
                setData: (key: keyof D, value: D[typeof key]) => this.setData(key, value),
                props: { ...this.#props }
              },
              event
            )
          )
      })
  }

  #render(propsChain: PropsChain<P>, updatePropsTrees: UpdatePropsTrees<P>): HTMLElement {
    const that: WelyElement<D, P> = this.#clone()
    const tagName: string = that.#getTagName()

    if (!customElements.get(tagName))
      customElements.define(
        tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }
        }
      )

    const wely = that.#component ?? document.createElement(tagName)

    that.#initializeProps(propsChain, updatePropsTrees)
    that.#addClass(wely)
    that.#addHtml(that.#getShadowRoot(wely))
    that.#addCss(that.#getShadowRoot(wely))
    that.#addEvents(wely)

    if (!that.#component) that.#component = wely

    return wely
  }

  overwrite(partialData: () => Partial<D>): WelyElement<D, P> {
    return this.#clone({ welyId: undefined, data: () => <D>{ ...this.#data, ...partialData() } })
  }

  getData<K extends keyof D>(key: K): D[typeof key] {
    if (key in this.#data) return this.#data[key]

    throw Error(`${key as string} is not defined in data...`)
  }

  setData(key: keyof D, value: D[typeof key]): void {
    if (!(key in this.#data)) throw Error(`${key as string} is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value

      console.log('data', key, value)

      this.#propsTrees.find(tree => tree.dataKey === key)?.setProps(value as unknown as P[keyof P])

      if (this.#reflections && key in this.#reflections) this.#reflections[key](this.#data[key])
    }
  }

  ssr(): string {
    return this.#renderOnServer(this.#propsChain)
  }

  define(): void {
    const that: WelyElement<D, P> = this.#clone()

    if (!customElements.get(that.#getTagName()))
      customElements.define(
        that.#getTagName(),
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot
          #isRendered: boolean = false

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
            this.innerHTML = ''
          }

          connectedCallback(): void {
            if (!this.#isRendered) {
              that.#initializeProps(that.#propsChain, that.#updatePropsTrees)
              that.#addClass(this)
              that.#addHtml(that.#getShadowRoot(this))
              that.#addCss(that.#getShadowRoot(this))
              that.#addEvents(this)
              this.#isRendered = true
            }
          }
        }
      )
  }
}
