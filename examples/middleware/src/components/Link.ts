import { fics, type FiCs } from 'ficsjs'

interface Props {
  href: string
  text: string
}

const html: FiCs.Html<{}, Props> = ({ props: { href, text }, template }) => {
  href = href.trim()

  if (href === '') throw new Error('The "href" must be a non-empty string...')
  return template`<p align="center"><a href="${href}">${text}</a></p>`
}

export default () => fics({ name: 'link', html })
