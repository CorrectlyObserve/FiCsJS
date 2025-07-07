import FiCsElement from '../core/class'
import { toArray } from '../core/helpers'
import defaultCss from './css'
import type { FiCsScroll, ScrollData } from './type'

export default <D, P extends object>({
  name,
  children,
  array,
  props,
  className,
  attributes,
  content,
  css,
  hooks,
  actions,
  options,
  sse
}: FiCsScroll<D, P>): FiCsElement<ScrollData<D>, P> =>
  new FiCsElement<ScrollData<D>, P>({
    name,
    children,
    data: () => ({ array }),
    props,
    className,
    attributes,
    html: ({ data: { array }, template, virtualArray }) => template`
      <div id="fics-scroll-area">
        <div id="fics-scroll-content">${virtualArray(array).map((item, index) => content(item, index))}</div>
      </div>
    `,
    css: css ? [...toArray(css), defaultCss] : defaultCss,
    hooks,
    actions,
    options,
    sse
  })
