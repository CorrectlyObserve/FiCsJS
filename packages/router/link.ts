import FiCsElement from '../core/class'
import { convertToArray, template } from '../core/helpers'
import goto from './goto'
import type { FiCsLink } from './types'

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
    html: ({ $template, $html, $show }) =>
      $template`<a href="${href}">${template(content({ $template, $html, $show }), $template)}</a>`,
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
