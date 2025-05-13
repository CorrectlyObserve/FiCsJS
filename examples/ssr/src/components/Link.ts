import { fics } from 'ficsjs'

export default () =>
  fics({
    name: 'link',
    data: () => ({ href: '', text: '' }),
    html: ({ data: { href, text }, template }) => template`
      <p class="text-base text-white text-center leading-none">
        <a class="clickable inline-block px-4 py-3.5" href="${href}"><span class="border-b">${text}</span></a>
      </p>
    `
  })
