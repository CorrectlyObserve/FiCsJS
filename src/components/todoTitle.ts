import { fics, html } from '../packages/core/fics'
import css from '../styles/todo.css?inline'

export const TodoTitle = () =>
  fics({
    name: 'todo-title',
    data: () => ({ md: 'var(--md)' }),
    html: ({ props: { length } }: { props: { length: number } }) =>
      html`<p>Remaining tasks: ${length}</p>`,
    css: [
      css,
      { style: ({ data: { md } }) => ({ display: 'block', marginBottom: `calc(${md} * 2)` }) },
      {
        selector: 'p',
        style: ({ data: { md } }) => ({ fontSize: md, color: '#fff', textAlign: 'center' })
      }
    ]
  })

export type TodoTitleType = ReturnType<typeof TodoTitle>
