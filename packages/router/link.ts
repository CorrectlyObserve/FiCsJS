import FiCsElement from '../core/class'
import goto from './goto'
import type { Content, FiCsLink } from './types'

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
}: FiCsLink<D>): FiCsElement<D, {}> =>
  new FiCsElement<D, {}>({
    name: 'link',
    isExceptional: true,
    isImmutable: true,
    inheritances,
    isOnlyCsr,
    className,
    attributes,
    html: ({ $template, $html, $show }) => {
      const returned: Content<D> = content({ $template, $html, $show })
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
