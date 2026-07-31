import { escape, isBrowser, joinArray, typedEntries } from '../core/helpers'
import { FICS_META } from './constants'

export const applyMeta = (meta?: Record<string, string>): void => {
  if (!isBrowser()) return

  const applied: Set<Element> = new Set()

  if (meta)
    for (const [key, value] of typedEntries(meta)) {
      if (key === 'title') {
        document.title = value
        continue
      }

      const { tagName, nameAttr, valAttr } = getMetaConfig(key),
        selector: string = `${tagName}[${nameAttr}="${key.replace(/["\\]/g, '\\$&')}"]`

      let tag: Element | null = document.head.querySelector(selector)
      if (!tag) {
        tag = document.createElement(tagName)
        tag.setAttribute(nameAttr, key)
        document.head.append(tag)
      }

      tag.setAttribute(valAttr, value)
      tag.setAttribute(FICS_META, '')
      applied.add(tag)
    }

  for (const tag of document.head.querySelectorAll(`[${FICS_META}]`))
    if (!applied.has(tag)) tag.remove()
}

export const getMetaConfig = (
  key: string
): { tagName: string; nameAttr: string; valAttr: string } => {
  if (key === 'canonical') return { tagName: 'link', nameAttr: 'rel', valAttr: 'href' }

  return {
    tagName: 'meta',
    nameAttr: key.startsWith('og:') ? 'property' : 'name',
    valAttr: 'content'
  }
}

export const renderMeta = (meta: Record<string, string>): string => {
  const tags: string[] = []

  for (const [key, value] of typedEntries(meta)) {
    if (key === 'title') {
      tags.push(`<title>${escape(value, 'text-content')}</title>`)
      continue
    }

    const { tagName, nameAttr, valAttr } = getMetaConfig(key)
    tags.push(`<${tagName} ${nameAttr}="${escape(key)}" ${valAttr}="${escape(value)}">`)
  }

  return joinArray(tags, { space: false, separator: '' })
}
