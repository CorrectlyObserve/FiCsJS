import FiCsElement from './class'
import { sanitize } from './helpers'
import type { DataParams, FiCsAwait, FiCsAwaitedData } from './types'

export default <P extends object>({
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
}: FiCsAwait<P>): FiCsElement<FiCsAwaitedData, P> =>
  new FiCsElement<FiCsAwaitedData, P>({
    name: 'await',
    isExceptional: true,
    props,
    className,
    data: () => ({ isLoaded: false, response: undefined }),
    attributes,
    html: ({ $data: { isLoaded, response }, $props, $template, $html, $show }) =>
      sanitize(
        isLoaded
          ? awaited({ $props, $template, $html, $show, $response: response })
          : (fallback?.({ $props, $template, $html, $show }) ?? ''),
        $template
      ),
    css,
    actions,
    hooks: {
      created: async (params: DataParams<FiCsAwaitedData, P>) =>
        await fetch({ $props: params.$props }).then(response => {
          params.$setData('isLoaded', true)
          params.$setData('response', response)
          hooks?.created?.(params)
        }),
      mounted: (params: DataParams<FiCsAwaitedData, P>) => hooks?.mounted?.(params),
      updated: hooks?.updated,
      destroyed: (params: DataParams<FiCsAwaitedData, P>) => hooks?.destroyed?.(params),
      adopted: (params: DataParams<FiCsAwaitedData, P>) => hooks?.adopted?.(params)
    },
    options: { ...(options ?? {}), immutable: false }
  })
