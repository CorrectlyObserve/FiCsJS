import FiCsElement from './class'
import { sanitize } from './helpers'
import type { AwaitedData, DataParams, FiCsAwait } from './types'

export default ({
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
}: FiCsAwait): FiCsElement<AwaitedData, {}> =>
  new FiCsElement<AwaitedData, {}>({
    name: 'await',
    isExceptional: true,
    inheritances,
    className,
    data: () => ({ data: { isLoaded: false, response: undefined } }),
    attributes,
    html: ({ $data: { data }, $template, $html, $show }) =>
      sanitize(
        data.isLoaded
          ? awaited({ $template, $html, $show, $response: data.response })
          : fallback({ $template, $html, $show }),
        $template
      ),
    css,
    actions,
    hooks: {
      created: async (dataParams: DataParams<AwaitedData, {}>) => {
        dataParams.$setData('data', { isLoaded: true, response: await fetch })
        hooks?.created?.(dataParams)
      },
      mounted: (dataParams: DataParams<AwaitedData, {}>) => hooks?.mounted?.(dataParams),
      updated: hooks?.updated,
      destroyed: (dataParams: DataParams<AwaitedData, {}>) => hooks?.destroyed?.(dataParams),
      adopted: (dataParams: DataParams<AwaitedData, {}>) => hooks?.adopted?.(dataParams)
    },
    options
  })
