import generate from './generator'
import addQueue from './queue'
import type {
  Action,
  Bindings,
  ClassName,
  Css,
  DataProps,
  FiCs,
  Html,
  Hooks,
  Inheritances,
  I18n,
  Method,
  PropsChain,
  PropsTree,
  Reflections,
  Sanitized,
  Slot,
  Style,
  Symbolized
} from './types'

const symbol: symbol = Symbol('sanitized')
const slotSymbol: symbol = Symbol('slot')
const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #reservedWords: Record<string, boolean> = { var: true }
  readonly #ficsId: string
  readonly #name: string
  readonly #tagName: string
  readonly #isImmutable: boolean = false
  readonly #data: D = {} as D
  readonly #reflections: Reflections<D> | undefined = undefined
  readonly #inheritances: Inheritances<D> = new Array()
  readonly #props: P = {} as P
  readonly #isOnlyCsr: boolean = false
  readonly #className: ClassName<D, P> | undefined = undefined
  readonly #html: Html<D, P>
  readonly #css: Css<D, P> = new Array()
  readonly #slots: { name: string; html: Slot<D, P> }[] = new Array()
  readonly #actions: Action<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {} as Hooks<D, P>
  readonly #propsTrees: PropsTree<D, P>[] = new Array()
  readonly #bindings: Bindings = {
    className: false,
    html: false,
    css: new Array(),
    actions: new Array()
  }
  readonly #ficsIdAttr: string = 'fics-id'

  #propsChain: PropsChain<P> = new Map()
  #component: HTMLElement | undefined = undefined
  readonly #newElements: Set<Element> = new Set()
  #isReflecting: boolean = false

  constructor({
    ficsId,
    name,
    isImmutable,
    data,
    reflections,
    inheritances,
    props,
    isOnlyCsr,
    className,
    html,
    css,
    slots,
    actions,
    hooks
  }: FiCs<D, P>) {
    if (this.#reservedWords[this.#toKebabCase(name)])
      throw new Error(`${name} is a reserved word in FiCsJS...`)
    else {
      this.#ficsId = ficsId ?? `fics${generator.next().value}`
      this.#name = this.#toKebabCase(name)
      this.#tagName = `f-${this.#name}`

      if (isImmutable) this.#isImmutable = isImmutable

      if (data) {
        if (this.#isImmutable)
          throw new Error(`${this.#tagName} is an immutable component, so it cannot define data...`)
        else {
          if (reflections) {
            let hasError = false

            for (const key of Object.keys(reflections)) {
              if (key in data()) continue

              if (!hasError) hasError = true
              throw new Error(`${key} is not defined in data...`)
            }

            if (!hasError) this.#reflections = { ...reflections }
          }

          for (const [key, value] of Object.entries(data())) this.#data[key as keyof D] = value
        }
      }

      if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]

      if (!this.#isImmutable && props) this.#props = { ...props } as P

      if (isOnlyCsr) this.#isOnlyCsr = true
      if (className) this.#className = className
      this.#html = html

      if (slots && slots.length > 0) this.#slots = [...slots]
      if (css && css.length > 0) this.#css = [...css]
      if (actions && actions.length > 0) this.#actions = [...actions]
      if (hooks) this.#hooks = { ...hooks }
    }
  }

  #toKebabCase = (str: string): string => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

  #setProps = (key: keyof P, value: P[typeof key]): void => {
    if (!(key in this.#props)) throw new Error(`${key as string} is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      addQueue({ ficsId: this.#ficsId, reRender: this.#reRender() })
    }
  }

  #initProps = (propsChain: PropsChain<P>): void => {
    if (this.#inheritances.length > 0)
      for (const { descendants, values } of this.#inheritances)
        for (const descendant of Array.isArray(descendants) ? descendants : [descendants]) {
          if (descendant.#isImmutable)
            throw new Error(
              `${this.#tagName} is an immutable component, so it cannot receive props...`
            )

          let dataKey: keyof D = '' as keyof D
          const data: [string, P][] = Object.entries({
            ...values((key: keyof D) => {
              dataKey = key

              return this.getData(dataKey)
            })
          })
          const descendantId: string = descendant.#ficsId

          for (const [key, value] of data) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (key in chain && propsChain.has(descendantId)) continue

            const numberId: number = parseInt(descendantId.replace('fics', ''))

            propsChain.set(descendantId, { ...chain, [key]: value })

            const { length }: { length: number } = this.#propsTrees
            const tree: PropsTree<D, P> = {
              numberId,
              dataKey,
              setProps: (value: P[keyof P]) => descendant.#setProps(key, value)
            }

            switch (length) {
              case 0:
                this.#propsTrees.push(tree)
                break

              case 1:
                this.#propsTrees[0].numberId > tree.numberId
                  ? this.#propsTrees.push(tree)
                  : this.#propsTrees.unshift(tree)
                break

              default:
                let min: number = 0
                let max: number = length - 1

                while (min <= max) {
                  const mid: number = Math.floor((min + max) / 2)

                  if (this.#propsTrees[mid].numberId <= tree.numberId) max = mid - 1
                  else min = mid + 1
                }

                this.#propsTrees.splice(min, 0, tree)
            }
          }
        }

    this.#propsChain = new Map(propsChain)

    for (const [key, value] of Object.entries(this.#propsChain.get(this.#ficsId) ?? {}))
      this.#props[key as keyof P] = value as P[keyof P]
  }

  #setDataProps = (): DataProps<D, P> =>
    this.#isImmutable
      ? { data: {} as D, props: {} as P }
      : { data: { ...this.#data }, props: { ...this.#props } }

  #setStyle = (param: Style<D, P>, host: string = ':host'): string => {
    const { style, selector } = param
    const entries: [string, unknown][] = Object.entries(
      typeof style === 'function' ? style(this.#setDataProps()) : style
    )
    const content: string = entries
      .map(([key, value]) => {
        key = this.#toKebabCase(key)
        if (key.startsWith('webkit')) key = `-${key}`

        return `${key}: ${value};`
      })
      .join('\n')

    return `${host} ${selector ?? ''}{${content}}`
  }

  #getStyle = (css: Css<D, P> = this.#css, host: string = ':host'): string => {
    if (css.length === 0) return ''

    return css.reduce((prev, curr) => {
      if (typeof curr !== 'string' && 'style' in curr) curr = ` ${this.#setStyle(curr, host)}`

      return `${prev}${curr}`
    }, '') as string
  }

  #sanitize = <T>({
    symbol,
    isSanitized,
    templates,
    variables
  }: {
    symbol: symbol
    isSanitized: boolean
    templates: TemplateStringsArray
    variables: unknown[]
  }): Record<symbol, T> => {
    let result: (T | unknown)[] = new Array()

    for (let [index, template] of templates.entries()) {
      template = template.trim()
      let variable: any = variables[index]

      if (variable && typeof variable === 'object' && symbol in variable) {
        if (typeof variable[symbol][0] === 'string')
          variable[symbol][0] = template + variable[symbol][0]
        else variable[symbol].unshift(template)

        result = [...result, ...variable[symbol]]
      } else {
        if (isSanitized && typeof variable === 'string')
          variable = variable.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        else if (variable === undefined) variable = ''

        if (index === 0 && template === '') result.push(variable)
        else {
          const { length } = result
          const last: Sanitized<D, P> | unknown = result[length - 1] ?? ''
          const isFiCsElement: boolean = variable instanceof FiCsElement

          if (last instanceof FiCsElement)
            isFiCsElement ? result.push(template, variable) : result.push(`${template}${variable}`)
          else {
            const inserted: string = `${last}${template}` + `${isFiCsElement ? '' : variable}`
            result.splice(length - 1, 1, inserted)

            if (isFiCsElement) result.push(variable)
          }
        }
      }
    }

    return { [symbol]: result as T }
  }

  #internationalize = ({ json, lang, keys }: I18n): string => {
    let texts: Record<string, string> | string = json[lang]

    if (texts) {
      for (const key of Array.isArray(keys) ? keys : [keys])
        if (typeof texts === 'object' && texts !== null && key in texts) texts = texts[key]

      if (typeof texts === 'string') return texts

      throw new Error(`There is no applicable value in json..`)
    } else throw new Error(`${lang}.json does not exist...`)
  }

  #getHtml = (): Sanitized<D, P> => {
    const template = (
      templates: TemplateStringsArray,
      ...variables: unknown[]
    ): Symbolized<Sanitized<D, P>> =>
      this.#sanitize({ symbol, isSanitized: true, templates, variables })

    const html = (templates: TemplateStringsArray, ...variables: unknown[]): Sanitized<D, P> =>
      this.#sanitize<Sanitized<D, P>>({ symbol, isSanitized: false, templates, variables })[symbol]

    const i18n = ({ json, lang, keys }: I18n): string =>
      this.#internationalize({ json, lang, keys })

    return this.#html({ ...this.#setDataProps(), template, html, i18n })[symbol]
  }

  #getClassName = (): string | undefined =>
    typeof this.#className === 'function' ? this.#className(this.#setDataProps()) : this.#className

  #setSlot = (slot: Slot<D, P>): string => {
    const template = (
      templates: TemplateStringsArray,
      ...variables: unknown[]
    ): Symbolized<string[]> =>
      this.#sanitize({ symbol: slotSymbol, isSanitized: true, templates, variables })

    const html = (templates: TemplateStringsArray, ...variables: unknown[]): string[] =>
      this.#sanitize<string[]>({ symbol: slotSymbol, isSanitized: false, templates, variables })[
        slotSymbol
      ]

    const i18n = ({ json, lang, keys }: I18n): string =>
      this.#internationalize({ json, lang, keys })

    const contents: string[] = slot({ ...this.#setDataProps(), template, html, i18n })[slotSymbol]

    return contents.reduce((prev, curr) => prev + curr, '')
  }

  #getSlots = (): string => {
    if (this.#slots.length === 0) return ''

    const getSlotId = (name: string): string => `${this.#ficsId}-${name}`

    const getStyle = (name: string): string => {
      if (this.#css.length === 0) return ''

      return this.#css.reduce((prev, curr) => {
        if (typeof curr === 'string') return ''

        const { slot }: Style<D, P> = curr

        if (slot !== name) return ''

        return `${prev}${this.#setStyle(curr, `#${getSlotId(name)}`)}`
      }, '') as string
    }

    return this.#slots.reduce((prev, { name, html }) => {
      const style: string = getStyle(name) === '' ? '' : `<style>${getStyle(name)}</style>`
      const slot: string = this.#setSlot(html)

      return `${prev}<div id="${getSlotId(name)}" slot="${name}">${style}${slot}</div>`
    }, '')
  }

  #renderOnServer = (propsChain: PropsChain<P>): string => {
    if (this.#isOnlyCsr) return `<${this.#tagName}></${this.#tagName}>`

    this.#initProps(propsChain)

    return `
        <${this.#tagName} class="${`${this.#name} ${this.#getClassName() ?? ''}`.trim()}">
          <template shadowrootmode="open">
            ${this.#css.length > 0 ? `<style>${this.#getStyle()}</style>` : ''}
            ${this.#getHtml().reduce(
              (prev, curr) =>
                `${prev}${
                  curr instanceof FiCsElement ? curr.#renderOnServer(this.#propsChain) : curr
                }`,
              ''
            )}
          </template>
          ${this.#getSlots()}
        </${this.#tagName}>
      `.trim()
  }

  #addClassName = (fics: HTMLElement, isRerendering?: boolean): void => {
    isRerendering
      ? fics.classList.remove(...Array.from(fics.classList))
      : (this.#bindings.className = typeof this.#className === 'function')

    this.#className
      ? fics.setAttribute('class', `${this.#name} ${this.#getClassName()}`)
      : fics.classList.add(this.#name)
  }

  #getChildNodes = (parent: ShadowRoot | DocumentFragment | Element): ChildNode[] =>
    Array.from(parent.childNodes)

  #removeChildNodes = (childNodes: ChildNode[]): void => {
    for (const childNode of childNodes) childNode.remove()
  }

  #addHtml(shadowRoot: ShadowRoot, isRerendering?: boolean): void {
    const oldChildNodes: ChildNode[] = this.#getChildNodes(shadowRoot)
    const children: Record<string, FiCsElement<D, P>> = {}
    const varTag: string = 'f-var'
    const createFragment = (content: string): DocumentFragment =>
      document.createRange().createContextualFragment(content)

    const newShadowRoot: DocumentFragment = createFragment(
      this.#getHtml().reduce((prev, curr) => {
        if (curr instanceof FiCsElement) {
          const ficsId: string = curr.#ficsId
          children[ficsId] = curr

          curr = `<${varTag} ${this.#ficsIdAttr}="${ficsId}"></${varTag}>`
        }

        return `${prev}${curr}`
      }, '') as string
    )

    for (const slotElement of Array.from(newShadowRoot.querySelectorAll('slot'))) {
      const slotName: string | null = slotElement.getAttribute('name')

      if (!slotName) continue

      const html: Slot<D, P> | undefined = this.#slots.find(slot => slot.name === slotName)?.html

      if (!html) continue

      for (const childNode of this.#getChildNodes(createFragment(this.#setSlot(html))))
        slotElement.parentNode?.insertBefore(childNode, slotElement)

      slotElement.remove()
    }

    const newChildNodes: ChildNode[] = this.#getChildNodes(newShadowRoot)
    const getFicsId = (element: Element): string | null => element.getAttribute(this.#ficsIdAttr)
    const isVarTag = (element: Element): boolean => element.localName === varTag

    if (!isRerendering || oldChildNodes.length === 0) {
      this.#bindings.html = typeof this.#html === 'function'

      const replace = (element: Element): void => {
        const ficsId: string | null = getFicsId(element)

        if (ficsId) {
          const child: FiCsElement<D, P> = children[ficsId]

          element.replaceWith(
            child.#isImmutable && child.#component
              ? child.#component
              : child.#render(this.#propsChain)
          )
        } else throw new Error(`The child FiCsElement has ${ficsId} does not exist...`)
      }

      for (const childNode of newChildNodes) {
        shadowRoot.append(childNode)

        if (childNode instanceof HTMLElement)
          if (isVarTag(childNode)) replace(childNode)
          else
            for (const element of Array.from(childNode.querySelectorAll(varTag))) replace(element)
      }
    } else if (newChildNodes.length === 0) this.#removeChildNodes(oldChildNodes)
    else {
      const getKey = (childNode: ChildNode): string | undefined => {
        if (childNode instanceof Element) return childNode.getAttribute('key') ?? undefined

        return undefined
      }

      function matchChildNode(oldChildNode: ChildNode, newChildNode: ChildNode): boolean {
        const isSameNode: boolean = oldChildNode.nodeName === newChildNode.nodeName

        if (oldChildNode instanceof Element && newChildNode instanceof Element) {
          const isFiCsElement: boolean =
            getFicsId(oldChildNode) === getFicsId(newChildNode) && isVarTag(newChildNode)
          const isSameKey: boolean = isSameNode && getKey(oldChildNode) === getKey(newChildNode)

          return isFiCsElement || isSameKey
        }

        return isSameNode
      }

      function patchChildNode(oldChildNode: ChildNode, newChildNode: ChildNode): void {
        if (oldChildNode.nodeName === '#text' && newChildNode.nodeName === '#text')
          oldChildNode.nodeValue = newChildNode.nodeValue
        else if (
          oldChildNode instanceof Element &&
          newChildNode instanceof Element &&
          !isVarTag(newChildNode)
        ) {
          const oldAttrs: NamedNodeMap = oldChildNode.attributes
          const newAttrs: NamedNodeMap = newChildNode.attributes
          const oldAttrList: Record<string, string> = {}

          for (let index = 0; index < oldAttrs.length; index++) {
            const { name, value } = oldAttrs[index]
            oldAttrList[name] = value
          }

          for (let index = 0; index < newAttrs.length; index++) {
            const { name, value } = newAttrs[index]

            if (oldAttrList[name] !== value) oldChildNode.setAttribute(name, value)

            delete oldAttrList[name]
          }

          for (const name in oldAttrList) oldChildNode.removeAttribute(name)

          updateChildNodes(
            oldChildNode,
            that.#getChildNodes(oldChildNode),
            that.#getChildNodes(newChildNode)
          )
        }
      }

      const that: FiCsElement<D, P> = this

      function insertBefore(
        parentNode: ShadowRoot | ChildNode,
        childNode: ChildNode,
        before: ChildNode | null
      ): void {
        if (childNode instanceof Element) that.#newElements.add(childNode)

        const applyCache = <T>(childNode: T): T => {
          if (childNode instanceof Element && isVarTag(childNode)) {
            const ficsId: string | null = getFicsId(childNode)
            const component: HTMLElement | undefined = children[ficsId ?? ''].#component

            if (component) return component as T
            else throw new Error(`The child FiCsElement has ${ficsId} does not exist...`)
          }

          return childNode
        }

        parentNode.insertBefore(applyCache(childNode), applyCache(before))
      }

      function updateChildNodes(
        parentNode: ShadowRoot | ChildNode,
        oldChildNodes: ChildNode[],
        newChildNodes: ChildNode[]
      ): void {
        let oldHead: number = 0
        let oldTail: number = oldChildNodes.length - 1
        let oldHeadNode: ChildNode = oldChildNodes[oldHead]
        let oldTailNode: ChildNode = oldChildNodes[oldTail]
        let newHead: number = 0
        let newTail: number = newChildNodes.length - 1
        let newHeadNode: ChildNode = newChildNodes[newHead]
        let newTailNode: ChildNode = newChildNodes[newTail]
        let headKey: number | undefined = undefined
        let tailKey: number | undefined = undefined

        while (oldHead <= oldTail && newHead <= newTail) {
          if (matchChildNode(oldHeadNode, newHeadNode)) {
            patchChildNode(oldHeadNode, newHeadNode)
            oldHeadNode = oldChildNodes[++oldHead]
            newHeadNode = newChildNodes[++newHead]
          } else if (matchChildNode(oldTailNode, newTailNode)) {
            patchChildNode(oldTailNode, newTailNode)
            oldTailNode = oldChildNodes[--oldTail]
            newTailNode = newChildNodes[--newTail]
          } else if (matchChildNode(oldHeadNode, newTailNode)) {
            patchChildNode(oldHeadNode, newTailNode)
            insertBefore(parentNode, oldHeadNode, newTailNode.nextSibling)
            oldHeadNode = oldChildNodes[++oldHead]
            newTailNode = newChildNodes[--newTail]
          } else if (matchChildNode(oldTailNode, newHeadNode)) {
            patchChildNode(oldTailNode, newHeadNode)
            insertBefore(parentNode, oldTailNode, oldHeadNode)
            oldTailNode = oldChildNodes[--oldTail]
            newHeadNode = newChildNodes[++newHead]
          } else {
            const keyMap: Record<string, number> = {}

            if (headKey === undefined && tailKey === undefined)
              for (let index = oldHead; index <= oldTail; index++) {
                const childNode: ChildNode = oldChildNodes[index]

                if (!(childNode instanceof Element)) continue

                const key: string | undefined = getKey(childNode)
                if (key) keyMap[key] = index
              }

            const newHeadKey: string | undefined = getKey(newHeadNode)
            const newTailKey: string | undefined = getKey(newTailNode)

            if (newHeadKey) headKey = keyMap[newHeadKey]
            if (newTailKey) tailKey = keyMap[newTailKey]

            if (headKey === undefined) {
              insertBefore(parentNode, newHeadNode, oldHeadNode)
              newHeadNode = newChildNodes[++newHead]
            } else if (tailKey === undefined) {
              insertBefore(parentNode, newTailNode, oldTailNode.nextSibling)
              newTailNode = newChildNodes[--newTail]
            } else if (headKey !== tailKey) {
              const targetNode: ChildNode = oldChildNodes[headKey]

              if (targetNode.nodeName === newHeadNode.nodeName)
                patchChildNode(targetNode, newHeadNode)
              else {
                insertBefore(parentNode, newHeadNode, oldHeadNode)
                targetNode.remove()
              }

              newHeadNode = newChildNodes[++newHead]
            }
          }
        }

        if (newHead <= newTail) {
          console.log('add')

          for (; newHead <= newTail; ++newHead) {
            const childNode: ChildNode = newChildNodes[newHead]
            const newChildNode: ChildNode | undefined = newChildNodes[newTail + 1] ?? undefined
            let before: ChildNode | undefined = undefined

            if (newChildNode)
              for (const oldChildNode of oldChildNodes)
                if (!before && newChildNode.isEqualNode(oldChildNode)) before = oldChildNode

            if (childNode) insertBefore(parentNode, childNode, before ?? null)
          }
        }

        if (oldHead <= oldTail) {
          console.log('delete')
          for (; oldHead <= oldTail; ++oldHead) oldChildNodes[oldHead]?.remove()
        }
      }

      updateChildNodes(shadowRoot, oldChildNodes, newChildNodes)
    }
  }

  #addCss = (shadowRoot: ShadowRoot, css: Css<D, P> = new Array()): void => {
    if (this.#css.length === 0) return

    if (css.length === 0)
      for (const [index, content] of this.#css.entries())
        if (typeof content !== 'string' && typeof content.style === 'function')
          this.#bindings.css.push(index)

    const stylesheet: CSSStyleSheet = new CSSStyleSheet()
    const style: Css<D, P> =
      css.length > 0 ? Array.from(new Set([...this.#css, ...css])) : this.#css

    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(this.#getStyle(style))
  }

  #getShadowRoot = (fics: HTMLElement): ShadowRoot => {
    if (fics.shadowRoot) return fics.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #addEvent = (element: Element, handler: string, method: Method<D, P>): void =>
    element.addEventListener(handler, (event: Event) =>
      method({
        ...this.#setDataProps(),
        setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
        event
      })
    )

  #getElements = (shadowRoot: ShadowRoot, selector: string): Element[] => {
    return Array.from(shadowRoot.querySelectorAll(`:host ${selector}`))
  }

  #addActions = (fics: HTMLElement): void => {
    if (this.#actions.length > 0)
      this.#actions.forEach((action, index) => {
        const { handler, selector, method }: Action<D, P> = action

        if (selector) {
          this.#bindings.actions.push(index)

          for (const element of this.#getElements(this.#getShadowRoot(fics), selector))
            this.#addEvent(element, handler, method)
        } else this.#addEvent(fics, handler, method)
      })
  }

  #callback = (key: keyof Hooks<D, P>): void => {
    this.#hooks[key]?.({
      ...this.#setDataProps(),
      setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value)
    })
  }

  #render = (propsChain: PropsChain<P>): HTMLElement => {
    const that: FiCsElement<D, P> = this

    if (!customElements.get(that.#tagName))
      customElements.define(
        that.#tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }

          connectedCallback(): void {
            that.#callback('connect')
          }

          disconnectedCallback(): void {
            that.#callback('disconnect')
          }

          adoptedCallback(): void {
            that.#callback('adopt')
          }
        }
      )

    const fics = document.createElement(this.#tagName)
    fics.setAttribute(this.#ficsIdAttr, this.#ficsId)
    this.#initProps(propsChain)
    this.#addClassName(fics)
    this.#addHtml(this.#getShadowRoot(fics))
    this.#addCss(this.#getShadowRoot(fics))
    this.#addActions(fics)

    if (!this.#component) {
      this.#removeChildNodes(Array.from(fics.childNodes))
      this.#component = fics
    }

    return fics
  }

  #reRender = (): void => {
    const fics: HTMLElement | undefined = this.#component

    if (fics) {
      const { className, html, css, actions }: Bindings = this.#bindings
      const shadowRoot: ShadowRoot = this.#getShadowRoot(fics)

      if (className) this.#addClassName(fics, true)

      if (html) this.#addHtml(shadowRoot, true)

      if (css.length > 0)
        this.#addCss(
          shadowRoot,
          css.map(index => this.#css[index])
        )

      if (actions.length > 0)
        for (const index of actions) {
          const { handler, selector, method }: Action<D, P> = this.#actions[index]

          if (selector) {
            for (const element of this.#getElements(shadowRoot, selector))
              if (this.#newElements.has(element)) this.#addEvent(element, handler, method)
          }
        }

      this.#newElements.clear()
    }
  }

  getData = <K extends keyof D>(key: K): D[typeof key] => {
    if (key in this.#data) return this.#data[key]

    throw new Error(`${key as string} is not defined in data...`)
  }

  setData = (key: keyof D, value: D[typeof key]): void => {
    if (this.#isReflecting) throw new Error(`${key as string} is not changed in reflections...`)
    else if (!(key in this.#data)) throw new Error(`${key as string} is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value
      addQueue({ ficsId: this.#ficsId, reRender: this.#reRender() })

      for (const { dataKey, setProps } of this.#propsTrees)
        if (dataKey === key) setProps(value as unknown as P[keyof P])

      if (this.#reflections && key in this.#reflections) {
        this.#isReflecting = true
        this.#reflections[key]?.(this.#data[key])
        this.#isReflecting = false
      }
    }
  }

  ssr = (parent?: HTMLElement | string): void => {
    const component: string = this.#renderOnServer(this.#propsChain)

    if (parent instanceof HTMLElement) parent.setHTMLUnsafe(component)
    else if (typeof parent === 'string') {
      const parentElement: HTMLElement | null = document.getElementById(parent)

      if (parentElement) parentElement.setHTMLUnsafe(component)
      else throw new Error(`The HTMLElement has #${parent} does not exist...`)
    }
  }

  define = (parent?: HTMLElement | string): void => {
    if (!customElements.get(this.#tagName)) {
      const that: FiCsElement<D, P> = this

      customElements.define(
        that.#tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot
          #isRendered: boolean = false

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }

          connectedCallback(): void {
            if (!this.#isRendered && this.shadowRoot.innerHTML.trim() === '') {
              that.#initProps(that.#propsChain)
              that.#addClassName(this)
              that.#addHtml(that.#getShadowRoot(this))
              that.#addCss(that.#getShadowRoot(this))
              that.#addActions(this)
              that.#callback('connect')
              that.#removeChildNodes(Array.from(this.childNodes))
              this.setAttribute(that.#ficsIdAttr, that.#ficsId)
              that.#component = this
              this.#isRendered = true
            }
          }

          disconnectedCallback(): void {
            that.#callback('disconnect')
          }

          adoptedCallback(): void {
            that.#callback('adopt')
          }
        }
      )

      if (parent) {
        const component = document.createElement(this.#tagName)

        if (parent instanceof HTMLElement) parent.append(component)
        else {
          const parentElement: HTMLElement | null = document.getElementById(parent)

          if (parentElement) parentElement.append(component)
          else throw new Error(`The HTMLElement has #${parent} does not exist...`)
        }
      }
    }
  }
}
