import FiCsElement from '../core/class'
import type { Descendant, Sanitized } from '../core/types'
import goto from './goto'
import type { FiCsLink, FiCsRouterElement } from './types'

export default <D extends object>({
  href,
  content,
  router,
  inheritances,
  isOnlyCsr,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsLink<D>): FiCsRouterElement<D> =>
  new FiCsElement<D, {}>({
    name: 'link',
    isExceptional: true,
    isImmutable: true,
    inheritances,
    isOnlyCsr,
    className,
    attributes,
    html: ({ $template, $html, $show }) => {
      const returned: Descendant | Sanitized<D, {}> = content({ $template, $html, $show })
      return $template`<a href="${href}">${returned instanceof FiCsElement ? $template`${returned}` : returned}</a>`
    },
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
    hooks
  })
