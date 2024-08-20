import fics from '../packages/core/fics'
import css from '../styles/todo.css?inline'

interface Data {
  md: string
}

interface Props {
  length: number
}

export const TodoTitle = () =>
  fics<Data, Props>({
    name: 'todo-title',
    data: () => ({ md: 'var(--md)' }),
    html: ({ $props: { length }, $template }) => $template`<p>Remaining tasks: ${length}</p>`,
    css: [
      css,
      { style: ({ $data: { md } }) => ({ display: 'block', marginBottom: `calc(${md} * 2)` }) },
      {
        selector: 'p',
        style: ({ $data: { md } }) => ({ fontSize: md, color: '#fff', textAlign: 'center' })
      }
    ]
  })

export type TodoTitleType = ReturnType<typeof TodoTitle>
