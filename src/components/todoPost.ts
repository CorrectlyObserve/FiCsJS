import { fics, html } from '../packages/core/fics'
import { SvgType } from './svg'
import css from '../styles/todoPost.css?inline'

export const TodoPost = (svg: SvgType) =>
  fics({
    name: 'todo-post',
    data: () => ({ binding: 'post', value: '', placeholder: 'Please enter a new task.' }),
    html: ({ data: { binding, value, placeholder } }) =>
      html`<div class="container">
        <input binding="${binding}" type="text" value="${value}" placeholder="${placeholder}" />
        ${svg}
      </div>`,
    css: [css],
    props: [{ descendants: svg, values: () => ({ path: 'add', color: '#fff' }) }],
    actions: [
      {
        handler: 'input',
        selector: 'input',
        method: ({ data: { binding }, setData }, event) =>
          setData('value', (<HTMLInputElement>event.target).value, binding)
      }
    ]
  })
