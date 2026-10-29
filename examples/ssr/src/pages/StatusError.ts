import { fics, type FiCs } from 'ficsjs'
import Link from '@/components/Link'
import { getStatusPage, type StatusPage } from '@/domain/status'

interface Data {
  readonly status: number
  readonly message: string
}

const props: FiCs.Props<Data, {}> = {
  descendants: ({ children: { link } }) => link,
  values: ({ data: { status } }) => {
    const { href, text }: StatusPage = getStatusPage(status)
    return { href, text }
  }
}

const html: FiCs.Html<Data, {}> = ({
  children: { link },
  data: { status, message },
  template
}) => template`
  <section>
    <p>${getStatusPage(status).description}</p>
    ${message !== '' && template`<p>${message}</p>`}
    ${link}
  </section>
`

const css: FiCs.Css<Data, {}> = `section p:nth-of-type(2) { overflow-wrap: anywhere; }`

export default fics<Data, {}>({
  name: 'error',
  children: [Link()],
  data: () => ({ status: 500, message: '' }),
  props,
  html,
  css
})
