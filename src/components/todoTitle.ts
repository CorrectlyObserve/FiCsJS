import { fics, html } from '../packages/core/fics'

export const TodoTitle = () =>
  fics({
    name: 'todo-title',
    html: ({ props: { numberOfTasks } }: { props: { numberOfTasks: number } }) =>
      html`<p>Remaining tasks: ${numberOfTasks}</p>`,
    css: [{ selector: 'p', style: () => ({ color: '#fff' }) }]
  })
