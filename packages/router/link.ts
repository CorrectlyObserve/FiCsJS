import FiCsElement from '../core/class'
import { getGlobalCss } from '../core/globalCss'
import type { FiCsLink, RouterContent, RouterData } from './types'

export default ({
  href,
  content,
  router,
  isOnlyCsr,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsLink): FiCsElement<RouterData, {}> =>
  new FiCsElement<RouterData, {}>({
    name: 'link',
    isExceptional: true,
    isImmutable: true,
    isOnlyCsr,
    className,
    attributes,
    html: ({ $template, $html, $show, $i18n }) => {
      const returned: RouterContent = content({ $template, $html, $show, $i18n })
      return $template`<a href="${href}">${returned instanceof FiCsElement ? $template`${returned}` : returned}</a>`
    },
    css: css ? [...getGlobalCss(), ...css] : getGlobalCss(),
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
