import FiCsElement from './class'
import { sanitize } from './helpers'
import type { DataParams, FiCsAwait, FiCsAwaitedData } from './types'

export default ({
  fetch,
  awaited,
  fallback,
  props,
  className,
  attributes,
  css,
  actions,
  hooks,
  options
}: FiCsAwait): FiCsElement<FiCsAwaitedData, {}> =>
  new FiCsElement<FiCsAwaitedData, {}>({
    name: 'await',
    isExceptional: true,
    props,
    className,
    data: () => ({ isLoaded: false, response: undefined }),
    attributes,
    html: ({ $data: { isLoaded, response }, $template, $html, $show }) =>
      sanitize(
        isLoaded
          ? awaited({ $template, $html, $show, $response: response })
          : (fallback?.({ $template, $html, $show }) ?? ''),
        $template
      ),
    css,
    actions,
    hooks: {
      created: async (dataParams: DataParams<FiCsAwaitedData, {}>) => {
        dataParams.$setData('isLoaded', true)
        dataParams.$setData('response', await fetch)
        hooks?.created?.(dataParams)
      },
      mounted: (dataParams: DataParams<FiCsAwaitedData, {}>) => hooks?.mounted?.(dataParams),
      updated: hooks?.updated,
      destroyed: (dataParams: DataParams<FiCsAwaitedData, {}>) => hooks?.destroyed?.(dataParams),
      adopted: (dataParams: DataParams<FiCsAwaitedData, {}>) => hooks?.adopted?.(dataParams)
    },
    options: { ...(options ?? {}), immutable: false }
  })
