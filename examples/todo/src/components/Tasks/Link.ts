import { ficsLink } from 'ficsjs/router'
import { calc, cssVar } from 'ficsjs/style'
import { measureOffsetWidth } from '@/utils/others'

export default ficsLink<{ id: number; title: string; completedAt?: number; status: string }>({
  attributes: ({ props: { title, status } }) => ({ 'aria-label': `${title} ${status}` }),
  href: ({ props: { id } }) => `/${measureOffsetWidth() ? '?taskId=' : ''}${id}`,
  content: ({ props: { title, completedAt }, template }) =>
    template`<span${completedAt ? ' class="done"' : ''}>${title}</span>`,
  css: {
    ':host': {
      width: calc(`100% - ${cssVar('xl')} * 1.5`),
      a: {
        display: 'flex',
        paddingBlock: cssVar('md'),
        lineHeight: 1,
        span: {
          lineHeight: 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '&.done': { textDecoration: 'line-through' }
        }
      }
    }
  }
})
