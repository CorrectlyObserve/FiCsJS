import { createUniqueId } from './generator'
import { Branch } from './types'
import {
  cloneNode,
  getChildNodes,
  keysInObj,
  manageError,
  toKebabCase,
} from './utils'

export class WelyElement extends HTMLElement {
  welyId!: string
  private readonly shadow!: ShadowRoot
  private isInitialized: boolean = false
  private isInitialRendered: boolean = false
  name!: string
  parent!: string
  html!: string
  css?: string
  events: { [key: string]: () => void } = {}
  private branchArg?: string
  private loopArg?: string
  private embedArg?: HTMLElement

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  branch(
    condition: boolean | (() => boolean),
    truth: Branch<WelyElement>,
    falsity?: Branch<WelyElement> | null
  ) {
    try {
      const convertByType = <T>(value: T) => {
        if (typeof value === 'function') return Function(`return ${value}`)()()

        return value
      }

      if (this.loopArg) this.branchArg = this.loopArg
      else {
        this.branchArg = `${this.branchArg || ''}${convertByType(
          convertByType(condition) ? truth : falsity
        )}`
      }

      return this
    } catch {
      throw Error('The third argument does not exist...')
    }
  }

  loop<T>(contents: T[], apply: (arg: T) => WelyElement | string) {
    this.loopArg = contents.reduce(
      (prev: string, self: T): string => `${prev}${apply(self)}`,
      ''
    )

    return this
  }

  embed(slotId: string, content?: string) {
    if (getChildNodes(content || slotId).length > 0) {
      this.embedArg = <HTMLElement>getChildNodes(content || slotId)[0]

      if (content) this.embedArg.setAttribute('slot', slotId)
    }

    return this
  }

  connectedCallback() {
    if (!this.isInitialized) {
      cloneNode(this.shadow, this.html)

      if (this.css) {
        const style = document.createElement('style')
        style.textContent = this.css

        this.shadow.appendChild(style)
      }

      this.isInitialized = true
    }
  }

  render() {
    if (!this.isInitialRendered) {
      document.getElementById(this.parent)!.appendChild(this)

      this.welyId = createUniqueId()
      this.setAttribute('id', this.welyId)

      if (keysInObj(this.events).is) {
        keysInObj(this.events).toArray.forEach((handler: string): void =>
          document
            .getElementById(this.welyId)!
            .addEventListener(handler, this.events[handler])
        )
      }
      this.setAttribute('class', toKebabCase(this.name))

      this.isInitialRendered = true
    }

    if (
      this.branchArg === undefined &&
      this.loopArg === undefined &&
      this.embedArg
    ) {
      try {
        this.append(this.embedArg)
      } catch (error: Error | string | unknown) {
        manageError(error)
      }
    } else if (this.branchArg) {
      cloneNode(this.shadow, this.branchArg)
      this.loopArg = undefined
      this.branchArg = undefined
    } else if (this.loopArg) {
      cloneNode(this.shadow, this.loopArg)
    }
  }
}
