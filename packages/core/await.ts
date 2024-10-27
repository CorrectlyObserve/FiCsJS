import FiCsElement from './class'
import { sanitize } from './helpers'
import type { FiCsAwait, DataParams } from './types'

export default <D extends { isLoaded: boolean; response?: D['response'] }>({
  fetch,
  awaited,
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
      sanitize(
        isLoaded
          ? awaited({ $template, $html, $show, $response: response })
          : fallback({ $template, $html, $show }),
        $template
      ),
    css,
    actions,
    hooks: {
      created: async (dataParams: DataParams<D, {}>) => {
        dataParams.$setData('response', await fetch)
        dataParams.$setData('isLoaded', true as D[keyof D])
        hooks?.created?.(dataParams)
      },
      mounted: (dataParams: DataParams<D, {}>) => hooks?.mounted?.(dataParams),
      updated: hooks?.updated,
      destroyed: (dataParams: DataParams<D, {}>) => hooks?.destroyed?.(dataParams),
      adopted: (dataParams: DataParams<D, {}>) => hooks?.adopted?.(dataParams)
    },
    options
  })
