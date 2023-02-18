import { createUniqueId } from './generator'
import { Branch } from './types'
import {
  cloneNode,
  getChildNodes,
  keysInObj,
  // manageError,
  toKebabCase,
} from './utils'

export class WelyElement extends HTMLElement {
  welyId!: string
  private readonly shadow!: ShadowRoot
  private isInitial: boolean = false
  name!: string
  html: string[] = []
  class?: string
  css?: string
  events: { [key: string]: () => void } = {}

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  branch(
    condition: boolean | (() => boolean),
    truthy: Branch<WelyElement>,
    falsity?: Branch<WelyElement> | null
  ) {
    const convertByType = <T>(value: T) => {
      if (typeof value === 'function') return Function(`return ${value}`)()()

      return value
    }

    this.html.push(
      `${convertByType(convertByType(condition) ? truthy : falsity)}`
    )

    return this
  }

  loop<T>(contents: T[], apply: (arg: T) => WelyElement | string) {
    this.html.push(
      contents.reduce(
        (prev: string, self: T): string => `${prev}${apply(self)}`,
        ''
      )
    )

    return this
  }

  embed(slotId: string, content?: string) {
    if (getChildNodes(content || slotId).length > 0) {
      const slotTag = `<slot ${content ? `name="${slotId}"` : ''}></slot>`
      const slot = <HTMLElement>getChildNodes(content || slotId)[0]

      if (content) slot.setAttribute('slot', slotId)

      this.html.push(`${slotTag}`)
      this.appendChild(slot)
    }

    return this
  }

  connectedCallback() {
    if (!this.isInitial) {
      this.welyId = <string>createUniqueId()
      this.setAttribute('id', this.welyId)

      if (this.css) {
        const style = document.createElement('style')
        style.textContent = this.css
        this.shadow.appendChild(style)
      }

      if (keysInObj(this.events).is) {
        keysInObj(this.events).toArray.forEach((handler: string): void =>
          document
            .getElementById(this.welyId)!
            .addEventListener(handler, this.events[handler])
        )
      }

      console.log(this.class)

      this.setAttribute(
        'class',
        toKebabCase(
          this.name +
            (this.class && !['if', 'each', 'slot'].includes(this.class)
              ? ` ${this.class}`
              : '')
        )
      )

      this.isInitial = true
    }

    cloneNode(this.shadow, this.html.join(''))
  }

  render() {
    // cloneNode(this.shadow, this.html.join(''))
    // try {
    //   if (this.branchArg && this.loopArg) {
    //     cloneNode(this.shadow, this.branchArg)
    //     if (!this.loopArg.includes('[object HTMLElement]')) {
    //       cloneNode(this.shadow, this.loopArg)
    //     }
    //     console.log(this.branchArg, this.loopArg)
    //   } else if (this.loopArg) {
    //     cloneNode(this.shadow, this.loopArg)
    //   } else if (this.branchArg) {
    //     cloneNode(this.shadow, this.branchArg)
    //   }
    // } catch (error) {
    //   manageError(error)
    // }
  }
}
