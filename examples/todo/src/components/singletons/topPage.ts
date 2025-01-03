import { fics } from 'ficsjs'
import { variable } from 'ficsjs/css'
import i18n from 'ficsjs/i18n'
import { goto } from 'ficsjs/router'
import button from '@/components/materials/button'
import { getPath } from '@/utils'

interface Data {
  headings: string[]
  descriptions: string[]
  features: string[]
  conversion: string
  buttonText: string
}

export default fics<Data, { lang: string }>({
  name: 'top-page',
  data: () => ({ buttonText: '' }),
  fetch: ({ props: { lang } }) => i18n<Data>({ directory: '/i18n', lang, key: 'topPage' }),
  props: {
    descendant: button,
    values: ({ props: { lang }, getData }) => ({
      buttonText: getData('buttonText'),
      click: () => goto(getPath(lang, '/todo'))
    })
  },
  html: ({
    data: {
      headings: [first, second],
      descriptions,
      features,
      conversion
    },
    template
  }) =>
    template`
      <h2>${first}</h2>
      <div><ul>${descriptions.map(description => template`<li>${description}</li>`)}</ul></div>
      <h2>${second}</h2>
      <div><ol>${features.map(feature => template`<li>${feature}</li>`)}</ol></div>
      <p>${conversion}</p>
      ${button}
    `,
  css: [
    {
      selector: 'div',
      style: { width: '60%', display: 'flex', justifyContent: 'center', marginInline: 'auto' },
      nested: {
        selector: 'li',
        style: { marginBottom: variable('md') },
        nested: { selector: ':last-child', style: { marginBottom: variable('ex-lg') } }
      }
    },
    { selector: 'p', style: { marginBlock: variable('ex-lg') } }
  ]
})
