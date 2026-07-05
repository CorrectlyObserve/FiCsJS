import { typedEntries } from './../../core/helpers'
import type { Rpc } from './../types'
import { assertSafeSegment, request, resolveSegments } from './request'

export const createRpcClient = <R>(
  basePath: string,
  { headers: clientHeaders, onMetric, ...args }: Rpc.Options.Client = {}
): Rpc.Client<R> => {
  const createChainProxy = (segments: string[], lastArgs: unknown[] | null): unknown => {
    let promise: Promise<unknown> | undefined

    return new Proxy(function () {}, {
      get(_, prop): unknown {
        if (typeof prop === 'symbol') return undefined

        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          if (lastArgs === null) return undefined

          const path: string = segments.join('/'),
            [input, { headers: callHeaders, method = 'POST', signal, ...callArgs } = {}] =
              lastArgs as [unknown, Rpc.Options.Call | undefined],
            headers: Headers = new Headers(clientHeaders)

          if (callHeaders)
            for (const [key, value] of new Headers(callHeaders)) headers.set(key, value)

          for (const [key, value] of typedEntries(callArgs)) if (value) args[key] = value

          promise ??= request({
            basePath,
            path,
            input,
            headers,
            ...args,
            onMetric,
            method,
            signal
          })

          /** @remarks 'then' | 'catch' | 'finally' */
          const promiseMethod: unknown = promise[prop]
          return typeof promiseMethod === 'function' ? promiseMethod.bind(promise) : promiseMethod
        }

        return createChainProxy(
          [...resolveSegments(segments, lastArgs), assertSafeSegment(prop)],
          null
        )
      },
      apply(_1, _2, args: unknown[] | null): unknown {
        return createChainProxy(resolveSegments(segments, lastArgs), args)
      }
    })
  }

  return createChainProxy([], null) as Rpc.Client<R>
}
