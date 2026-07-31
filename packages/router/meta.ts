import { escape, isBrowser, joinArray, typedEntries } from '../core/helpers'

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
