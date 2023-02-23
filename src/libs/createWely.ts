import { WelifyArg } from './types'
import { toKebabCase } from './utils'
import { WelyElement } from './wely'

export const createWely = ({
  name = '',
  html,
  className,
  css,
  events = {},
}: WelifyArg): void => {
  if (name !== '') {
    const welyName: string = `w-${toKebabCase(name)}`

    customElements.define(
      welyName,
      class extends WelyElement {
        constructor() {
          super()
          this.name = name
          this.html = html
          this.class = className
          this.css = css
          this.events = { ...events }
        }
      }
    )
  }
}
