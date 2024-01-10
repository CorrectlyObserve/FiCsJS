import { fics, html } from '../packages/core/fics'
import { SvgType } from './svg'
import css from '../styles/todoPost.css?inline'

export const TodoPost = (svg: SvgType) =>
  fics({
    name: 'todo-post',
    data: () => ({
      bind: 'post',
      value: '',
      placeholder: 'Please enter a new task.',
      aaa: (value: string) => console.log(value)
    }),
    props: [{ descendants: svg, values: () => ({ path: 'add', color: '#fff' }) }],
    html: ({ bind, value, placeholder }) =>
      html`<div class="container">
        <input bind="${bind}" type="text" value="${value}" placeholder="${placeholder}" />${svg}
      </div>`,
    css: [css],
    actions: [
      {
        handler: 'input',
        selector: 'input',
        method: ({ data: { bind }, setData, event }) =>
          setData('value', (event.target as HTMLInputElement).value, bind)
      },
      {
        handler: 'keydown',
        selector: 'input',
        method: ({ data: { value }, event }, { keydown }: { keydown: (str: string) => void }) => {
          if ((event as KeyboardEvent).key === 'Enter') keydown('value: ' + value)
        }
      }
    ]
  })

export type TodoPostType = ReturnType<typeof TodoPost>
