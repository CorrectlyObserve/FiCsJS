import { fics, html } from '../packages/core/fics'
import css from '../styles/todo.css?inline'

export const TodoTitle = () =>
  fics({
    name: 'todo-title',
    html: ({ props: { numberOfTasks } }: { props: { numberOfTasks: number } }) =>
      html`<p>Remaining tasks: ${numberOfTasks}</p>`,
    css: [
      css,
      { style: () => ({ display: 'block', marginBottom: 'calc(var(--md) * 2)' }) },
      { selector: 'p', style: () => ({ fontSize: 'var(--md)', color: '#fff', textAlign: 'center' }) }
    ]
  })

export type TodoTitleType = ReturnType<typeof TodoTitle>
