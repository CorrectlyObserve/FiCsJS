import FiCsElement from '../core/class'
import { convertToArray } from '../core/helpers'
import goto from './goto'
import type { Content, FiCsLink } from './types'

export default <D extends object>({
  href,
  content,
  router,
  inheritances,
  className,
  attributes,
  css,
  actions,
  hooks,
  options
}: FiCsLink<D>): FiCsElement<D, {}> =>
  new FiCsElement<D, {}>({
    name: 'link',
    isExceptional: true,
    inheritances,
    className,
    attributes,
    html: ({ $template, $html, $show }) => {
      const returned: Content<D> = content({ $template, $html, $show })
      return $template`<a href="${href}">${returned instanceof FiCsElement ? $template`${returned}` : returned}</a>`
    },
    css,
    actions: [
      ...(actions ? convertToArray(actions) : []),
      {
        handler: 'click',
        selector: 'a',
        method: ({ $event }) => {
          $event.preventDefault()
          goto(href, { history: true, reload: false })
          router.setData('pathname' as keyof D, href as D[keyof D])
        }
      }
    ],
    hooks,
    options: { ...(options ?? {}), immutable: true }
  })
