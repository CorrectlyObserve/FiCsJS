import { ficsLink, type FiCsLink } from 'ficsjs/router'
import { calc, size, truncate } from 'ficsjs/style'
import { white } from '@/utils/others'

interface Props {
  id: number
  title: string
  completedAt?: number
  status: string
  isQuery: boolean
}

const attributes: FiCsLink.Attributes<Props> = ({ props: { title, status } }) => ({
  'aria-label': `${title} ${status}`
})

const href: FiCsLink.Href<Props> = ({ props: { id, isQuery } }) =>
  `/${isQuery ? '?taskId=' : ''}${id}`

const content: FiCsLink.Content<Props> = ({ props: { title, completedAt }, template }) =>
  template`<span${completedAt ? ' class="done"' : ''}>${title}</span>`

const css: FiCsLink.Css<Props> = ({ cssToString }) => `
  :host {
    width: ${calc(`100% - ${size(12)}`)};

    a {
      display: flex;
      color: ${white()};
      padding: ${size(4)};

      span {
        ${cssToString(truncate())}
        width: 100%;
        line-height: inherit;

        &.done { text-decoration: line-through; }
      }
    }
  }
`

export default ficsLink<Props>({ attributes, href, content, css })
