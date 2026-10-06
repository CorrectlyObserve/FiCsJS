import { removeTrailingSlash } from '../../core/helpers'
import { INDEX_HTML } from '../constants'
import { fillDynamicPath } from '../dynamicPaths'
import { isDynamicPath } from '../helpers'
import type { Routing } from '../types'
import { join } from 'node:path'

/** @returns "something" -> "something/index.html" */
export const toFilePath = (path: string): string =>
  path === '/' ? INDEX_HTML : join(path.replace(/^\/+/, ''), INDEX_HTML)

export const toFullPath = ({ origin, path }: { origin: string; path: string }): string =>
  `${removeTrailingSlash(origin)}${path}`

export const toStaticPaths = async ({
  path,
  page: { prerender }
}: {
  path: string
  /** @remarks Narrows to "prerender", as this executes without a request context. */
  page: Pick<Routing.ServerModule, 'prerender'>
}): Promise<string[]> => {
  if (!isDynamicPath(path)) {
    if (typeof prerender === 'function')
      throw new Error(`Set "prerender" to true as "${path}" has no parameters...`)

    return [path]
  }

  if (typeof prerender !== 'function')
    throw new Error(`Make "prerender" a function as "${path}" needs its parameters...`)

  const paths: string[] = []
  for (const params of await prerender()) {
    const filled: string | null = fillDynamicPath(path, params)

    if (filled === null)
      throw new Error(
        `Provide all parameters as "prerender" of "${path}" returned ${JSON.stringify(params)}...`
      )

    paths.push(filled)
  }

  return paths
}
