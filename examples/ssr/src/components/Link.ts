import { fics, type FiCs } from 'ficsjs'
import { white } from '@/utils'

interface Data {
  href: string
  text: string
}

const html: FiCs.Html<Data, {}> = ({ data: { href, text }, template }) => {
  href = href.trim()

  if (href === '') throw new Error('The "href" must be a non-empty string...')

  return template`
    <p class="text-base text-white text-center leading-none">
      <a class="clickable inline-block p-4 mb-3 rounded-lg" href="${href}">
        <span class="border-b">${text}</span>
      </a>
    </p>
  `
}
const css: FiCs.Css<Data, {}> = `a:hover { background: ${white(0.1)}; }`

export default () => fics({ name: 'back-link', data: () => ({ href: '', text: '' }), html, css })
