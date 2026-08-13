import { fics, type FiCs } from 'ficsjs'
import Link from '@/components/Link'

interface Data {
  description: string
  message: string
}

const html: FiCs.Html<Data, {}> = ({
  children: { link },
  data: { description, message },
  template
}) => template`
  <div class="text-base text-white text-center">
    <p class="pt-4 mb-4">${description}</p>
    ${message === '' ? template`<p class="mb-6 break-words">aaa</p>` : template`<p class="mb-6 break-words">${message}</p>`}
    ${link}
  </div>
`

export default fics<Data, {}>({
  name: 'error',
  children: [Link],
  data: () => ({ description: '', message: '' }),
  html
})
