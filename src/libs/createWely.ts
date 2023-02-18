import { WelifyArg } from './types'
import { keysInObj, toKebabCase } from './utils'
import { WelyElement } from './wely'

export const createWely = ({
  name = '',
  html,
  className,
  css,
  events = {},
}: WelifyArg): WelyElement | void => {
  if (name !== '') {
    const welyName: string = `w-${toKebabCase(name)}`
    customElements.define(welyName, class extends WelyElement {})

    const welified = <WelyElement>document.createElement(welyName)
    welified.name = name
    welified.html.push(html)
    welified.class = className
    welified.css = css

    if (keysInObj(events).is) {
      keysInObj(events).toArray.forEach(
        (handler: string) => (welified.events[handler] = events[handler])
      )
    }

    return welified
  }
}
