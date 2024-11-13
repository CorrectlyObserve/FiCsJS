import FiCsElement from './class'
import { sanitize } from './helpers'
import type { DataParams, FiCsAwait, FicsAwaitData } from './types'

export default <R, P extends object>({
  fetch,
  html,
  fallback,
  props,
  options
}: FiCsAwait<R, P>): FiCsElement<FicsAwaitData<R>, P> =>
  new FiCsElement<FicsAwaitData<R>, P>({
    name: 'await',
    isExceptional: true,
    data: () => ({ isLoaded: false, res: undefined }) as FicsAwaitData<R>,
    props,
    html: ({ $data: { isLoaded, res }, ...args }) =>
      sanitize(
        isLoaded ? html({ ...args, $response: res }) : (fallback?.({ ...args }) ?? ''),
        args.$template
      ),
    hooks: {
      created: async (params: DataParams<FicsAwaitData<R>, P>) =>
        await fetch(params).then(res => {
          params.$setData('isLoaded', true)
          params.$setData('res', res)
        })
    },
    options
  })
