import { fics, type FiCs } from 'ficsjs'
import Link from '@/components/Link'
import { getStatusPage, type StatusPage } from '@/domain/status'

interface Data {
  status: number
  message: string
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

export default fics<Data, {}>({
  name: 'error',
  children: [Link],
  data: () => ({ description: '', message: '' }),
  html
})
