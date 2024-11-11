import FiCsElement from './class'
import { sanitize } from './helpers'
import type { DataParams, FiCsAwait, Poll } from './types'

export default <D extends object, P extends object, R>({
  data,
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
}: FiCsAwait<D, P, R>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name: 'await',
    isExceptional: true,
    props,
    className,
    data: () => {
      for (const key of ['isLoaded', 'response'])
        if (data && key in data())
          throw new Error(`"${key}" is a reserved word in f-await component...`)

      return { ...(data?.() ?? {}), isLoaded: false, response: undefined } as D
    },
    attributes,
    html: ({ $data, $props, $template, $html, $show }) => {
      const { isLoaded, response }: { isLoaded: boolean; response: R } = $data as {
        isLoaded: boolean
        response: R
      }

      return sanitize(
        isLoaded
          ? awaited({ $data, $props, $template, $html, $show, $response: response })
          : (fallback?.({ $data, $props, $template, $html, $show }) ?? ''),
        $template
      )
    },
    css,
    actions,
    hooks: {
      created: async (params: DataParams<D, P>) =>
        await fetch(params).then(response => {
          params.$setData('isLoaded' as keyof D, true as D[keyof D])
          params.$setData('response' as keyof D, response as D[keyof D])
          hooks?.created?.(params)
        }),
      mounted: (params: DataParams<D, P> & Poll) => hooks?.mounted?.(params),
      updated: hooks?.updated,
      destroyed: (params: DataParams<D, P>) => hooks?.destroyed?.(params),
      adopted: (params: DataParams<D, P>) => hooks?.adopted?.(params)
    },
    options
  })
