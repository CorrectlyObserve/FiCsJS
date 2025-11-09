import { ficsLink } from 'ficsjs/router'
import { calc, cssVar } from 'ficsjs/style'
import type { Task } from '@/types'
import { measureOffsetWidth } from '@/utils/others'

export default ({ id, title, completedAt }: Partial<Task>) =>
  ficsLink({
    href: `/${measureOffsetWidth() ? '?taskId=' : ''}${id}`,
    content: ({ template }) => template`<span class="${completedAt ? 'done' : ''}">${title}</span>`,
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
            textOverflow: 'ellipsis'
          }
        }
      }
    }
  })
