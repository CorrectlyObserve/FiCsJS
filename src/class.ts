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
  readonly #slot: Html<D, P> | Slot<D, P> | undefined = undefined
  readonly #css: Css<D, P> = []
  readonly #events: Events<D, P> = []
  readonly #reflections: Reflections<D> | undefined = undefined
  readonly #dataBindings: { class: boolean; html: boolean; css: number[]; events: number[] } = {
    class: false,
    html: false,
    css: [],
    events: []
  }

  #propsChain: PropsChain<P> = { chains: {}, map: new Map() }
  #propsMap: Map<keyof D, Set<string>> = new Map()
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

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #getTagName(): string {
    return `w-${this.#toKebabCase(this.#name)}`
  }

  // #setProps<K extends keyof P>(key: K, value: P[K]): void {
  //   if (this.#props[key] !== value) {
  //     this.#props[key] = value
  //   }
  // }

  #setPropsChain(propsChain: PropsChain<P> = this.#propsChain): void {
    if (this.#inheritances.length > 0)
      for (const inheritance of this.#inheritances) {
        const { descendants, values } = inheritance

        for (const descendant of Array.isArray(descendants) ? descendants : [descendants]) {
          const welyId: string = descendant.#welyId

          const getData = (key: keyof D) => {
            this.#propsMap.has(key)
              ? this.#propsMap.get(key)?.add(welyId)
              : this.#propsMap.set(key, new Set([welyId]))

            return this.getData(key)
          }

          const data = { ...values((key: keyof D) => getData(key)) }
          const [key] = Object.entries(data)[0]

          if (new Set(Object.keys(propsChain.chains)).has(welyId)) {
            const setPropsChain = (chain: Record<string, P>): void => {
              const localChain = chain[welyId]

              localChain.isPrototypeOf(localChain)
                ? setPropsChain(Object.getPrototypeOf(localChain))
                : Object.setPrototypeOf(localChain, data)
            }

            setPropsChain(propsChain.chains)
          } else {
            propsChain.chains[welyId] = data

            if (!propsChain.map.has(key)) propsChain.map.set(key, this.#welyId)
          }
        }
      }

    this.#propsChain = { ...propsChain }

    if (new Set(Object.keys(this.#propsChain.chains)).has(this.#welyId))
      for (const key in this.#propsChain.chains[this.#welyId])
        this.#props[key] = this.#propsChain.chains[this.#welyId][key]

    console.log(this.#name, this.#propsChain, this.#inheritances)
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

  #addHtml(shadowRoot: ShadowRoot, html: Html<D, P> = this.#html): void {
    const elements = this.#convertHtml(html)

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
            const slotName = this.#convertHtml(element.#html)?.[0] ?? ''
            const slot = this.#getSlot(<string>slotName)

            if (slot) this.#addHtml(shadowRoot, slot)
            else
              throw Error(`${this.#name} has no ${slotName === '' ? 'unnamed' : slotName} slot...`)
          } else throw Error(`${this.#name} has no slot contents...`)
        } else
          shadowRoot.appendChild(
            element instanceof WelyElement
              ? element.#component ?? element.#render(this.#propsChain)
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

      const stylesheet = new CSSStyleSheet()
      shadowRoot.adoptedStyleSheets = [stylesheet]
      stylesheet.replace(<string>style)
    }
  }

  #getShadowRoot(wely: HTMLElement): ShadowRoot {
    const shadowRoot = wely.shadowRoot

    if (shadowRoot) return wely.shadowRoot

    throw Error(`${this.#name} does not have a shadowRoot...`)
  }

  #addEvents(wely: HTMLElement): void {
    if (this.#events.length > 0)
      this.#events.forEach((event, index) => {
        const { selector, handler, method } = event

        if (selector) {
          this.#dataBindings.events.push(index)

          const elements = []
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

  #render(propsChain?: PropsChain<P>): HTMLElement {
    const that = this.#clone()
    const tagName = that.#getTagName()

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

    that.#setPropsChain(propsChain)
    that.#addClass(wely)
    that.#addHtml(that.#getShadowRoot(wely))
    that.#addCss(that.#getShadowRoot(wely))
    that.#addEvents(wely)

    if (!that.#component) that.#component = wely

    return wely
  }

  #renderOnServer(propsChain?: PropsChain<P>): string {
    const that = this.#clone()
    const tagName = that.#getTagName()

    if (that.#isOnlyCsr) return `<${tagName}></${tagName}>`

    that.#setPropsChain(propsChain)

    const addHtml = (html: Html<D, P>): string => {
      const elements = that.#convertHtml(html)
      const name = that.#name

      if (elements) return <string>elements.reduce((prev, curr) => {
          if (curr instanceof WelyElement && curr.#getTagName() === 'w-slot') {
            if (that.#slot) {
              const slotName = that.#convertHtml(curr.#html)?.[0] ?? ''
              const slot = that.#getSlot(<string>slotName)

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
        <${name} class="${that.#addClass()}">
          <template shadowroot="open"><slot></slot>${that.#addCss() ?? ''}</template>
          ${addHtml(that.#html)}
        </${name}>
      `.trim()
  }

  overwrite(partialData: () => Partial<D>): WelyElement<D, P> {
    return this.#clone({ welyId: undefined, data: () => <D>{ ...this.#data, ...partialData() } })
  }

  getData(key: keyof D): D[typeof key] {
    if (key in this.#data) return this.#data[key]

    throw Error(`${key as string} is not defined in data...`)
  }

  setData(key: keyof D, value: D[typeof key]): void {
    if (!(key in this.#data)) throw Error(`${key as string} is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value

      if (this.#reflections && key in this.#reflections) this.#reflections[key](this.#data[key])

      console.log('data', key, this.#data[key])
    }
  }

  define(): void {
    const that = this.#clone()

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
              that.#setPropsChain()
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

  ssr(): string {
    return this.#renderOnServer()
  }
}
