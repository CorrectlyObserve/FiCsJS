import { escape, isBrowser, typedEntries } from '../core/helpers'
import { STATUS_PAGE_META, statusCodes } from './constants'
import type { Routing } from './types'

const defaultMeta: Map<string, string> = new Map(),
  activeMetaKeys: Set<string> = new Set(),
  getMetaConfig = (key: string): { tagName: string; nameAttr: string; valAttr: string } => {
    if (key === 'canonical') return { tagName: 'link', nameAttr: 'rel', valAttr: 'href' }

    return {
      tagName: 'meta',
      nameAttr: key.startsWith('og:') ? 'property' : 'name',
      valAttr: 'content'
    }
  }

export const applyMeta = (
  meta?: Record<string, string>,
  { merge }: { merge?: boolean } = {}
): void => {
  if (!isBrowser()) return

  for (const key of new Set([...Object.keys(meta ?? {}), ...(merge ? [] : activeMetaKeys)])) {
    const value: string | undefined = meta?.[key]

    if (value === undefined) activeMetaKeys.delete(key)
    else if (merge) defaultMeta.set(key, value)
    else activeMetaKeys.add(key)

    const target: string | undefined = value ?? defaultMeta.get(key)

    if (key === 'title') {
      if (target !== undefined) document.title = target
    } else {
      const { tagName, nameAttr, valAttr }: ReturnType<typeof getMetaConfig> = getMetaConfig(key)
      let tag: Element | null = document.head.querySelector(
        `${tagName}[${nameAttr}="${CSS.escape(key)}"]`
      )

      if (target === undefined) {
        tag?.remove()
        continue
      }

      if (tag === null) {
        tag = document.createElement(tagName)
        tag.setAttribute(nameAttr, key)
        document.head.append(tag)
      }

      tag.setAttribute(valAttr, target)
    }
  }
}

export const injectMeta = ({ html, metaTags }: { html: string; metaTags: string }): string => {
  if (metaTags === '' || html.includes(metaTags)) return html

  const closing: RegExpMatchArray | null = html.match(/<\/head\s*>/i),
    createMeta = (end: number): string => `${html.slice(0, end)}${metaTags}${html.slice(end)}`

  if (closing?.index !== undefined) return createMeta(closing.index)

  const opening: RegExpMatchArray | null = html.match(/<head(?:\s[^>]*)?>/i)
  if (opening?.index === undefined) return html

  return createMeta(opening.index + opening[0].length)
}

export const renderMeta = (meta: Record<string, string>): string => {
  const tags: string[] = []

  for (const [key, value] of typedEntries(meta)) {
    if (key === 'title') {
      tags.push(`<title>${escape(value, 'text-content')}</title>`)
      continue
    }

    const { tagName, nameAttr, valAttr }: ReturnType<typeof getMetaConfig> = getMetaConfig(key)
    tags.push(`<${tagName} ${nameAttr}="${escape(key)}" ${valAttr}="${escape(value)}">`)
  }

  return tags.join('')
}

export const resolveMeta = ({
  defaultMeta = {},
  meta = {},
  status
}: {
  defaultMeta?: Record<string, string>
  meta?: Routing.Meta
  status: Routing.Status.Resolved
}): Record<string, string> => ({
  ...defaultMeta,
  ...(status === statusCodes.OK ? {} : STATUS_PAGE_META),
  ...(typeof meta === 'function' ? meta({ status }) : meta)
})
