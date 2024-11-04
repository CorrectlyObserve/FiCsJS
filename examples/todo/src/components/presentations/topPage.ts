import { fics } from 'ficsjs'
import button from '@/components/presentations/button'
import goto from '@/utils'

interface Props {
  lang: string
  titles: string[]
  descriptions: string[]
  features: string[]
  conversion: string
  buttonText: string
}

export default fics<{}, Props>({
  name: 'top-page',
  props: {
    descendant: button,
    values: ({ $props: { buttonText, lang } }) => ({ buttonText, click: () => goto(lang, 'todo') })
  },
  html: ({ $props: { titles, descriptions, features, conversion }, $template }) =>
    $template`
      <h2>${titles[0]}</h2>
      <div><ul>${descriptions.map(description => $template`<li>${description}</li>`)}</ul></div>
      <h2>${titles[1]}</h2>
      <div><ol>${features.map(feature => $template`<li>${feature}</li>`)}</ol></div>
      <p>${conversion}</p>
      ${button}
    `,
  css: [
    {
      selector: 'div',
      style: { display: 'flex', justifyContent: 'center' },
      nested: {
        selector: ['ul', 'ol'],
        style: { minWidth: '60%', maxWidth: '80%' },
        nested: {
          selector: 'li',
          style: { marginBottom: 'var(--md)' },
          nested: { selector: ':last-child', style: { marginBottom: 'var(--ex-lg)' } }
        }
      }
    },
    { selector: 'p', style: { marginBlock: 'var(--ex-lg)' } }
  ]
})
