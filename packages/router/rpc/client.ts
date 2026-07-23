import { typedEntries } from '../../core/helpers'
import type { Rpc } from '../types'
import { assertSafeSegment, request, resolveSegments } from './request'

let globalOptions: Rpc.Options.Client = {}

export const configRpcClient = (options: Rpc.Options.Client): void => {
  globalOptions = options
}

export const createRpcClient = <R>(
  basePath: string,
  { headers: clientHeaders, ...clientArgs }: Rpc.Options.Client = {}
): Rpc.Client<R> => {
  const createChainProxy = (segments: string[], lastArgs: unknown[] | null): unknown => {
    let promise: Promise<unknown> | undefined

    return new Proxy(function () {}, {
      get(_, prop): unknown {
        if (typeof prop === 'symbol') return undefined

        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          if (lastArgs === null) return undefined

          const path: string = segments.join('/'),
            { headers: globalHeaders, ...globalArgs }: Rpc.Options.Client = globalOptions,
            [input, { headers: calledHeaders, method = 'POST', signal, ...calledArgs } = {}] =
              lastArgs as [unknown, Rpc.Options.Call | undefined]

          const headers: Headers = new Headers(globalHeaders)
          for (const init of [clientHeaders, calledHeaders])
            if (init) for (const [key, value] of new Headers(init)) headers.set(key, value)

          const args: Omit<Rpc.Options.Client, 'headers'> = { ...globalArgs, ...clientArgs }
          for (const [key, value] of typedEntries(calledArgs)) if (value) args[key] = value

          promise ??= request({
            basePath,
            path,
            input,
            headers,
            ...args,
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
