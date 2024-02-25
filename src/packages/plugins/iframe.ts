import FiCsElement from '../core/class'
import { FiCsIframe } from '../core/types'
import { toKebabCase } from '../core/utils'

class FiCsIframeElement<D extends object, P extends object> extends FiCsElement<D, P> {
  constructor({ props, isOnlyCsr, className, css }: FiCsIframe<D, P>) {
    super({
      name: 'iframe',
      props,
      isOnlyCsr,
      className,
      html: ({ template, props }) => {
        const properties: string = Object.entries(props).reduce(
          (prev, [key, value]) => `${prev}\n${toKebabCase(key)}="${value}"`,
          ''
        )
        return template`<iframe ${properties}></iframe>`
      },
      css
    })
  }
}

const ficsIframe = <D extends object, P extends object>({
  props,
  isOnlyCsr,
  className,
  css
}: FiCsIframe<D, P>): FiCsIframeElement<D, P> =>
  new FiCsIframeElement({ props, isOnlyCsr, className, css })

export default ficsIframe
