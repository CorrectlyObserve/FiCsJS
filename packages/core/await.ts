import FiCsElement from './class'
import { sanitize } from './helpers'
import type { FiCsAwait, AwaitedData, DataParams } from './types'

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
    html: ({
      $data: {
        data: { isLoaded, response }
      },
      $template,
      $html,
      $show
    }) =>
      sanitize(
        isLoaded
          ? awaited({ $template, $html, $show, $response: response })
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
