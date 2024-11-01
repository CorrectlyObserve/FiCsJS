import FiCsElement from '../core/class'
import { sanitize } from '../core/helpers'
import goto from './goto'
import type { FiCsLink } from './types'

export default <D extends object>({
  href,
  content,
  router,
  props,
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
    props,
    className,
    attributes,
    html: ({ $template, $html, $show }) =>
      $template`<a href="${href}">${sanitize(content({ $template, $html, $show }), $template)}</a>`,
    css,
    actions: [
      ...(actions ?? []),
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
