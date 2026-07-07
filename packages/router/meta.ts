import { escape, isBrowser, joinArray, typedEntries } from '../core/helpers'

export const applyMeta = (meta?: Record<string, string>): void => {
  if (!isBrowser() || !meta) return

  if (typeof meta.title === 'string') document.title = meta.title

  if (typeof meta.description === 'string') {
    let tag: Element | null = document.head.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.append(tag)
    }
    tag.setAttribute('content', meta.description)
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

  return joinArray(tags, { space: false })
}
