import { ficsLink } from 'ficsjs/router'
import { calc, cssVar } from 'ficsjs/style'
import { white } from '@/utils/others'

export default ficsLink<{
  id: number
  title: string
  completedAt?: number
  status: string
  isQuery: boolean
}>({
  attributes: ({ props: { title, status } }) => ({ 'aria-label': `${title} ${status}` }),
  href: ({ props: { id, isQuery } }) => `/${isQuery ? '?taskId=' : ''}${id}`,
  content: ({ props: { title, completedAt }, template }) =>
    template`<span${completedAt ? ' class="done"' : ''}>${title}</span>`,
  css: {
    ':host': {
      width: calc(`100% - ${cssVar('xl')} * 1.5`),
      a: {
        display: 'flex',
        color: white(),
        paddingBlock: cssVar('md'),
        paddingInline: calc(`${cssVar('xl')} / 2`),
        lineHeight: 1,
        span: {
          width: '100%',
          lineHeight: 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '&.done': { textDecoration: 'line-through' }
        },
        '&:focus, &:focus-visible': { span: { color: 'inherit' } }
      }
    }
  }
})
