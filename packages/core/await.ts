import FiCsElement from './class'
import { convertContent } from './helpers'
import type { FiCsAwait, DataParams } from './types'

export default <D extends { isLoaded: boolean; response?: D['response'] }>({
  fetch,
  content,
  fallback,
  inheritances,
  className,
  attributes,
  css,
  actions,
  hooks,
  options
}: FiCsAwait<D>): FiCsElement<D, {}> =>
  new FiCsElement<D, {}>({
    name: 'await',
    isExceptional: true,
    inheritances,
    className,
    data: () => ({ isLoaded: false, response: undefined }) as D,
    attributes,
    html: ({ $data: { isLoaded, response }, $template, $html, $show }) =>
      convertContent(
        isLoaded
          ? content({ $template, $html, $show, $response: response })
          : fallback({ $template, $html, $show }),
        $template
      ),
    css,
    actions,
    hooks: {
      created: async (params: DataParams<D, {}>) => {
        params.$setData('response', await fetch)
        params.$setData('isLoaded', true as D[keyof D])
        hooks?.created?.(params)
      },
      mounted: (params: DataParams<D, {}>) => hooks?.mounted?.(params),
      updated: hooks?.updated,
      destroyed: (params: DataParams<D, {}>) => hooks?.destroyed?.(params),
      adopted: (params: DataParams<D, {}>) => hooks?.adopted?.(params)
    },
    options
  })
