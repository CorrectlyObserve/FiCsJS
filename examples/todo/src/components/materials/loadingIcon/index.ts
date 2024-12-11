import { fics } from 'ficsjs'
import css from './style.css?inline'

export default fics({
  name: 'loading',
  html: ({ $template }) => $template`<button class="loading" />`,
  css,
  options: { immutable: true }
})
