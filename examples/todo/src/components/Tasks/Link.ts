import { ficsLink } from 'ficsjs/router'
import { calc, cssVar, truncate } from 'ficsjs/style'
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
  css: ({ cssToString }) => `
    :host {
      width: ${calc(`100% - ${cssVar('xl')} * 1.5`)};

      a {
        display: flex;
        color: ${white()};
        padding-block: ${cssVar('md')};
        padding-inline: calc(${cssVar('xl')} / 2);
        line-height: 1;

        span {
          ${cssToString(truncate())}
          width: 100%;
          line-height: inherit;

          &.done { text-decoration: line-through; }
        }
      }
    }
  `
})
