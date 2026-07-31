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
    switch (key) {
      case 'title':
        tags.push(`<title>${escape(value, 'text-content')}</title>`)
        break

      case 'canonical':
        tags.push(`<link rel="canonical" href="${escape(value)}">`)
        break

      default:
        tags.push(
          `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${escape(key)}" content="${escape(value)}">`
        )
    }
  }

  return joinArray(tags, { space: false, separator: '' })
}
