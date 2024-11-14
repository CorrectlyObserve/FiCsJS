import FiCsElement from '../core/class'
import { sanitize } from '../core/helpers'
import goto from './goto'
import type { FiCsLink } from './types'

export default <P extends object>({
  href,
  content,
  router,
  props,
  css,
  options
}: FiCsLink<P>): FiCsElement<{}, P> =>
  new FiCsElement<{}, P>({
    name: 'link',
    isExceptional: true,
    props,
    html: ({ $template, ...args }) =>
      $template`<a href="${href}">${sanitize(content({ $template, ...args }), $template)}</a>`,
    css,
    actions: [
      {
        handler: 'click',
        selector: 'a',
        method: ({ $event }) => {
          $event.preventDefault()
          goto(href, { history: true, reload: false })
          router.setData('pathname', href)
        }
      }
    ],
    options
  })
