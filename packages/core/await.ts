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
    data: () => ({ isLoaded: false, res: undefined }) as FicsAwaitData<D>,
    props,
    html: ({ $data: { isLoaded, res }, ...args }) =>
      sanitize(
        isLoaded ? html({ ...args, $response: res }) : (fallback?.({ ...args }) ?? ''),
        args.$template
      ),
    hooks: {
      created: async ({ $props, $setData }) =>
        await fetch({ $props }).then(res => {
          $setData('isLoaded', true)
          $setData('res', res)
        })
    },
    options
  })
