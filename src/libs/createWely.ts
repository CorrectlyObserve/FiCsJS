import { WelifyArg } from './types'
import { eachKeys, toKebabCase } from './utils'
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
    welified.html = html
    welified.class = className
    welified.css = css

    eachKeys(events, (handler) => (welified.events[handler] = events[handler]))

    // if (Object.keys(events).length > 0) {
    //   Object.keys(events).forEach(
    //     (handler: string) => (welified.events[handler] = events[handler])
    //   )
    // }

    return welified
  }
}
