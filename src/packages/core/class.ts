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
  HooksCallback,
  Inheritances,
  Method,
  PropsChain,
  Reflections,
  Sanitized,
  Style,
  Symbolized
} from './types'

const symbol: symbol = Symbol('sanitized')
const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #reservedWords: Record<string, boolean> = { var: true }
  readonly #ficsId: string
  readonly #newElementAttr: string = ''
  readonly #name: string
  readonly #tagName: string
  readonly #isImmutable: boolean = false
  readonly #data: D = {} as D
  readonly #reflections: Reflections<D> | undefined = undefined
  readonly #inheritances: Inheritances<D> = new Array()
  readonly #props: P = {} as P
  readonly #isOnlyCsr: boolean = false
  readonly #className: ClassName<D, P> | undefined = undefined
  readonly #html: Html<D, P> = { [symbol]: new Array() }
  readonly #css: Css<D, P> = new Array()
  readonly #actions: Action<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {} as Hooks<D, P>
  readonly #propsTrees: {
    numberId: number
    dataKey: keyof D
    setProps: (value: P[keyof P]) => void
  }[] = new Array()
  readonly #bindings: Bindings = {
    className: false,
    html: false,
    css: new Array(),
    actions: new Array()
  }
  readonly #ficsIdAttr: string = 'fics-id'

  #propsChain: PropsChain<P> = new Map()
  #component: HTMLElement | undefined = undefined
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
    actions,
    hooks
  }: FiCs<D, P>) {
    if (this.#reservedWords[this.#toKebabCase(name)])
      throw new Error(`${name} is a reserved word in FiCsJS...`)
    else {
      this.#ficsId = ficsId ?? `fics${generator.next().value}`
      this.#newElementAttr = `${this.#ficsId}-new-element`
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

      this.#html = typeof html === 'function' ? html : { ...html }

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
            const tree: {
              numberId: number
              dataKey: keyof D
              setProps: (value: P[keyof P]) => void
            } = {
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

  #getStyle = (css: Css<D, P> = this.#css): string => {
    if (css.length === 0) return ''

    const createStyle = (param: Style<D, P>): string => {
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

      return `:host ${selector ?? ''}{${content}}`
    }

    return css.reduce((prev, curr) => {
      if (typeof curr !== 'string' && 'style' in curr) curr = ` ${createStyle(curr)}`

      return `${prev}${curr}`
    }, '') as string
  }

  #sanitize = (
    isSanitized: boolean,
    templates: TemplateStringsArray,
    ...variables: unknown[]
  ): Record<symbol, Sanitized<D, P>> => {
    let result: (Sanitized<D, P> | unknown)[] = new Array()

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

    return { [symbol]: result as Sanitized<D, P> }
  }

  #getHtml = (): Sanitized<D, P> => {
    const template = (
      templates: TemplateStringsArray,
      ...variables: unknown[]
    ): Symbolized<Sanitized<D, P>> => this.#sanitize(true, templates, ...variables)

    const html = (templates: TemplateStringsArray, ...variables: unknown[]): Sanitized<D, P> =>
      this.#sanitize(false, templates, ...variables)[symbol]

    return (
      typeof this.#html === 'function'
        ? this.#html({ ...this.#setDataProps(), template, html })
        : this.#html
    )[symbol]
  }

  #getClassName = (): string | undefined =>
    typeof this.#className === 'function' ? this.#className(this.#setDataProps()) : this.#className

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

  #addHtml(shadowRoot: ShadowRoot, isRerendering?: boolean): void {
    if (!isRerendering) this.#bindings.html = typeof this.#html === 'function'

    const oldChildNodes: ChildNode[] = Array.from(shadowRoot.childNodes)
    const children: Record<string, FiCsElement<D, P>> = {}
    const varTag: string = 'f-var'
    const fragment: DocumentFragment = document.createRange().createContextualFragment(
      this.#getHtml().reduce((prev, curr) => {
        if (curr instanceof FiCsElement) {
          const ficsId: string = curr.#ficsId
          children[ficsId] = curr

          return `${prev}<${varTag} ${this.#ficsIdAttr}="${ficsId}"></${varTag}>`
        }

        return `${prev}${curr}`
      }, '') as string
    )
    const getFicsId = (element: Element): string | null => element.getAttribute(this.#ficsIdAttr)
    const getChild = (element: Element): FiCsElement<D, P> => {
      const ficsId: string | null = getFicsId(element)

      if (ficsId) return children[ficsId]

      throw new Error(`The child FiCsElement has ${ficsId} does not exist...`)
    }
    const newChildNodes: ChildNode[] = Array.from(fragment.childNodes)
    const isVarTag = (element: Element): boolean => element.localName === varTag

    if (!isRerendering || oldChildNodes.length === 0) {
      const replace = (element: Element): void => {
        const child: FiCsElement<D, P> = getChild(element)

        element.replaceWith(
          child.#isImmutable && child.#component
            ? child.#component
            : child.#render(this.#propsChain)
        )
      }

      for (const childNode of newChildNodes) {
        shadowRoot.append(childNode)

        if (childNode instanceof HTMLElement)
          if (isVarTag(childNode)) replace(childNode)
          else
            for (const element of Array.from(childNode.querySelectorAll(varTag))) replace(element)
      }
    } else if (newChildNodes.length === 0)
      for (const childNode of oldChildNodes) shadowRoot.removeChild(childNode)
    else {
      const getKey = (childNode: ChildNode): string | undefined => {
        if (childNode instanceof Element) return childNode.getAttribute('key') ?? undefined

        return undefined
      }
      const newElementAttr: string = this.#newElementAttr

      function matchChildNode(oldChildNode: ChildNode, newChildNode: ChildNode): boolean {
        const isSameNode: boolean = oldChildNode.nodeName === newChildNode.nodeName

        if (oldChildNode instanceof Element && newChildNode instanceof Element) {
          const isFiCsElement: boolean =
            getFicsId(oldChildNode) === getFicsId(newChildNode) && isVarTag(newChildNode)

          return isFiCsElement || (isSameNode && getKey(oldChildNode) === getKey(newChildNode))
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
            Array.from(oldChildNode.childNodes),
            Array.from(newChildNode.childNodes)
          )
        }
      }

      function insertBefore(
        parentNode: ShadowRoot | ChildNode,
        inserted: ChildNode | HTMLElement,
        before: ChildNode | null
      ): void {
        if (inserted instanceof Element && isVarTag(inserted)) {
          const ficsId: string | null = getFicsId(inserted)

          if (ficsId && children[ficsId].#component)
            parentNode.insertBefore(children[ficsId].#component, before)

          throw new Error(`The child FiCsElement has ${ficsId} does not exist...`)
        } else {
          if (inserted instanceof Element) inserted.toggleAttribute(newElementAttr)
          parentNode.insertBefore(inserted, before)
        }
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

            if (headKey === undefined)
              for (let index = oldHead; index <= oldTail; ++index) {
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
            } else {
              const targetNode: ChildNode = oldChildNodes[headKey]

              if (targetNode.nodeName === newHeadNode.nodeName) {
                patchChildNode(targetNode, newHeadNode)
                insertBefore(parentNode, targetNode, oldHeadNode)
              } else {
                insertBefore(parentNode, newHeadNode, oldHeadNode)
                parentNode.removeChild(targetNode)
              }

              newHeadNode = newChildNodes[++newHead]
            }
          }
        }

        if (newHead <= newTail)
          for (; newHead <= newTail; ++newHead) {
            const childNode: ChildNode = newChildNodes[newHead]

            if (childNode)
              insertBefore(parentNode, childNode, newChildNodes[newTail + 1] ?? undefined)
          }

        if (oldHead <= oldTail)
          for (; oldHead <= oldTail; ++oldHead) {
            const childNode: ChildNode = oldChildNodes[oldHead]

            if (childNode) parentNode.removeChild(childNode)
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

  #addMethod = (element: Element, handler: string, method: Method<D, P>): void =>
    element.addEventListener(handler, (event: Event) =>
      method({
        ...this.#setDataProps(),
        setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
        event
      })
    )

  #addEvent = (fics: HTMLElement, action: Action<D, P>, isRerendering?: boolean): void => {
    const { selector }: Action<D, P> = action

    if (selector) {
      const getElements = (selector: string): Element[] =>
        Array.from(this.#getShadowRoot(fics).querySelectorAll(`:host ${selector}`))

      const elements: Element[] = getElements(selector)
      const { handler, method }: Action<D, P> = action

      if (isRerendering) {
        const newElements: Set<Element> = new Set(getElements(`*[${this.#newElementAttr}]`))

        for (const element of elements)
          if (newElements.has(element)) {
            this.#addMethod(element, handler, method)
            element.removeAttribute(this.#newElementAttr)
          }
      } else for (const element of elements) this.#addMethod(element, handler, method)
    }
  }

  #addActions = (fics: HTMLElement): void => {
    if (this.#actions.length > 0)
      this.#actions.forEach((event, index) => {
        const { handler, selector, method }: Action<D, P> = event

        if (selector) {
          this.#bindings.actions.push(index)
          this.#addEvent(fics, event)
        } else this.#addMethod(fics, handler, method)
      })
  }

  #callback = (key: keyof Hooks<D, P>): void => {
    const hook: HooksCallback<D, P> | undefined = this.#hooks[key]

    if (hook)
      hook({
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

          connectedCallback() {
            that.#callback('connectedCallback')
          }

          disconnectedCallback() {
            that.#callback('disconnectedCallback')
          }

          adoptedCallback() {
            that.#callback('adoptedCallback')
          }
        }
      )

    const fics = document.createElement(this.#tagName)
    fics.setAttribute(this.#ficsIdAttr, this.#ficsId)
    const shadowRoot: ShadowRoot = this.#getShadowRoot(fics)

    this.#initProps(propsChain)
    this.#addClassName(fics)
    this.#addHtml(shadowRoot)
    this.#addCss(shadowRoot)
    this.#addActions(fics)

    if (!this.#component) this.#component = fics

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
        for (const index of actions) this.#addEvent(fics, this.#actions[index], true)
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

  ssr = (): string => this.#renderOnServer(this.#propsChain)

  define = (): void => {
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

              const shadowRoot: ShadowRoot = that.#getShadowRoot(this)
              that.#addHtml(shadowRoot)
              that.#addCss(shadowRoot)

              that.#addActions(this)
              that.#callback('connectedCallback')

              this.setAttribute(that.#ficsIdAttr, that.#ficsId)
              that.#component = this
              this.#isRendered = true
            }
          }

          disconnectedCallback() {
            that.#callback('disconnectedCallback')
          }

          adoptedCallback() {
            that.#callback('adoptedCallback')
          }
        }
      )
    }
  }
}
