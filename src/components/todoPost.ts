import { fics, html } from '../packages/core/fics'
import { SvgType } from './svg'
import css from '../styles/todoPost.css?inline'

export const TodoPost = (svg: SvgType) =>
  fics({
    name: 'todo-post',
    data: () => ({ bind: 'post', value: '', placeholder: 'Please enter a new task.' }),
    props: [{ descendants: svg, values: () => ({ path: 'add', color: '#fff' }) }],
    html: ({ data: { bind, value, placeholder } }) =>
      html`<div class="container">
        <input bind="${bind}" type="text" value="${value}" placeholder="${placeholder}" />${svg}
      </div>`,
    css: [css],
    actions: [
      {
        handler: 'input',
        selector: 'input',
        method: ({ data: { bind }, setData }, event) =>
          setData('value', (event.target as HTMLInputElement).value, bind)
      }
    ]
  })

export type TodoPostType = ReturnType<typeof TodoPost>
