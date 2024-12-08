export default (lang: string, path?: string): string =>
  `/${lang === 'en' ? '' : `${lang}/`}${path ?? ''}`
