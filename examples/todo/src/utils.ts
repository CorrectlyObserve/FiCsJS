import { goto } from 'ficsjs/router'

export default (lang: string, path?: string): void =>
  goto(`/${lang === 'en' ? '' : `${lang}/`}${path ?? ''}`)
