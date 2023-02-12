import { createUniqueId } from './generator'
import { Branch } from './types'
import {
  copyElements,
  extractFirstChild,
  keysInObj,
  manageError,
} from './utils'

export class WelyElement extends HTMLElement {
  welyId!: string
  private readonly shadow!: ShadowRoot
  name!: string
  parent!: string
  html!: string
  css?: string
  private isInitialized: boolean = false
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

      this.branchArg = `${this.branchArg || ''}${convertByType(
        convertByType(condition) ? truth : falsity
      )}`

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
    this.embedArg = extractFirstChild(content || slotId)

    if (content) this.embedArg.setAttribute('slot', slotId)

    return this
  }

  connectedCallback() {
    if (!this.isInitialized) {
      copyElements(this.shadow, this.html)

      if (this.css) {
        const style = document.createElement('style')
        style.textContent = this.css

        this.shadow.appendChild(style)
      }

      this.isInitialized = true
    }
  }

  render() {
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

    this.setAttribute('class', this.name)

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
    } else if (this.branchArg && this.loopArg) {
      copyElements(this.shadow, this.branchArg)
    } else if (this.branchArg) {
      this.shadow.appendChild(extractFirstChild(this.branchArg).cloneNode(true))
    } else if (this.loopArg) {
      copyElements(this.shadow, this.loopArg)
    }
  }
}
