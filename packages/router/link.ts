import FiCsElement from '../core/class'
import type { FiCsLink, RouterContent, RouterData } from './types'

const Link = ({
  href,
  content,
  router,
  isOnlyCsr,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsLink) =>
  new FiCsElement<RouterData, {}>({
    name: 'link',
    isExceptional: true,
    isImmutable: true,
    isOnlyCsr,
    className,
    attributes,
    html: ({ $template, $html, $show, $i18n }) => {
      const returned: RouterContent = content({ $template, $html, $show, $i18n })
      return $template`
        <a href="${href}">${returned instanceof FiCsElement ? $template`${returned}` : returned}</a>
      `
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

export default Link
