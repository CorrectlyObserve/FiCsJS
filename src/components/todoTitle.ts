import { fics } from '../packages/core/fics'
import css from '../styles/todo.css?inline'

export const TodoTitle = () =>
  fics({
    name: 'todo-title',
    data: () => ({ md: 'var(--md)' }),
    html: ({ html }, { length }: { length: number }) => html`<p>Remaining tasks: ${length}</p>`,
    css: [
      css,
      { style: ({ md }) => ({ display: 'block', marginBottom: `calc(${md} * 2)` }) },
      {
        selector: 'p',
        style: ({ md }) => ({ fontSize: md, color: '#fff', textAlign: 'center' })
      }
    ]
  })

export type TodoTitleType = ReturnType<typeof TodoTitle>
