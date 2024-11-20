import FiCsElement from './class'
import { sanitize } from './helpers'
import type { FiCsAwait, FicsAwaitData } from './types'

export default <D, P extends object>({
  props,
  fetch,
  html,
  fallback,
  options
}: FiCsAwait<D, P>): FiCsElement<FicsAwaitData<D>, P> =>
  new FiCsElement<FicsAwaitData<D>, P>({
    name: 'await',
    isExceptional: true,
    data: () => ({ isLoaded: false, response: undefined }),
    props,
    html: ({ $data: { isLoaded, response }, ...args }) =>
      sanitize(
        isLoaded ? html({ $data: { response }, ...args }) : (fallback?.({ ...args }) ?? ''),
        args.$template
      ),
    hooks: {
      created: async ({ $props, $setData }) =>
        await fetch({ $props }).then(response => {
          $setData('isLoaded', true)
          $setData('response', response)
        })
    },
    options: { ...(options ?? {}), ssr: false }
  })
