import FiCsElement from '../core/class'
import type { FiCsLink, FiCsRouterElement, RouterContent, RouterData } from './types'

export default ({
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
}: FiCsLink): FiCsRouterElement =>
  new FiCsElement<RouterData, {}>({
    name: 'link',
    isExceptional: true,
    isImmutable: true,
    inheritances,
    isOnlyCsr,
    className,
    attributes,
    html: ({ $template, $html, $show }) => {
      const returned: RouterContent = content({ $template, $html, $show })
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
          window.history.pushState({}, '', href)
          router.setData('pathname', href)
        }
      }
    ],
    hooks
  })
