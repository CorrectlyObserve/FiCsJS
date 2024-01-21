import fics from '../packages/core/fics'
import { SvgType } from './svg'
import css from '../styles/todoPost.css?inline'

export const TodoPost = (svg: SvgType) =>
  fics({
    name: 'todo-post',
    data: () => ({ value: '', placeholder: 'Please enter a new task.' }),
    inheritances: [{ descendants: svg, values: () => ({ path: 'add', color: '#fff' }) }],
    props: {} as { keydown: (str: string) => void },
    html: ({ data: { value, placeholder }, html, bind }) =>
      html`aaa
        <div ${bind()} class="container">
          <input
            ${bind()}
            class="${value}"
            type="text"
            value="${value}"
            placeholder="${placeholder}"
          />${svg}
        </div>
        <p style="color:#fff">value: <span>${value}</span></p>
        <span ${bind()}>${value}</span>`,
    css: [css],
    actions: [
      {
        handler: 'input',
        selector: 'input',
        method: ({ setData, event }) => setData('value', (event.target as HTMLInputElement).value)
      },
      {
        handler: 'keydown',
        selector: 'input',
        method: ({ data: { value }, props: { keydown }, event }) => {
          if ((event as KeyboardEvent).key === 'Enter') keydown('value: ' + value)
        }
      }
    ]
  })

export type TodoPostType = ReturnType<typeof TodoPost>
