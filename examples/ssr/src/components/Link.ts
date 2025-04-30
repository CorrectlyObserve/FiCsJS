import { fics } from 'ficsjs'

export default ({ href, text }: { href: string; text: string }) =>
  fics({
    name: 'link',
    html: ({ template }) =>
      template`
        <p class="text-base text-white text-center">
          <a class="inline-block px-4 py-3 duration-200 ease-out hover:opacity-50 focus:scale-90" href="${href}">
            <span class="border-b">${text}</span>
          </a>
        </p>
      `
  })
