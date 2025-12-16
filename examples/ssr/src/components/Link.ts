import { fics } from 'ficsjs'

export default () =>
  fics({
    name: 'back-link',
    data: () => ({ href: '', text: '' }),
    html: ({ data: { href, text }, template }) => template`
      <p class="text-base text-white text-center leading-none">
        <a class="clickable inline-block p-4 mb-3" href="${href}">
          <span class="border-b">${text}</span>
        </a>
      </p>
    `
  })
