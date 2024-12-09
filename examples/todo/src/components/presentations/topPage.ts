import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import { goto } from 'ficsjs/router'
import button from '@/components/presentations/button'
import getPath from '@/utils'

interface Data {
  titles: string[]
  descriptions: string[]
  features: string[]
  conversion: string
  buttonText: string
}

export default fics<Data, { lang: string }>({
  name: 'top-page',
  data: () => ({ titles: [], descriptions: [], features: [], conversion: '', buttonText: '' }),
  fetch: ({ $props: { lang } }) => i18n<Data>({ directory: '/i18n', lang, key: 'topPage' }),
  props: {
    descendant: button,
    values: [
      { key: 'buttonText', content: ({ $data: { buttonText } }) => buttonText },
      {
        key: 'click',
        content:
          ({ $props: { lang } }) =>
          () =>
            goto(getPath(lang, '/todo'))
      }
    ]
  },
  html: ({
    $data: {
      titles: [first, second],
      descriptions,
      features,
      conversion
    },
    $template
  }) =>
    $template`
      <h2>${first}</h2>
      <div><ul>${descriptions.map(description => $template`<li>${description}</li>`)}</ul></div>
      <h2>${second}</h2>
      <div><ol>${features.map(feature => $template`<li>${feature}</li>`)}</ol></div>
      <p>${conversion}</p>
      ${button}
    `,
  css: [
    {
      selector: 'div',
      style: { width: '60%', display: 'flex', justifyContent: 'center', marginInline: 'auto' },
      nested: {
        selector: 'li',
        style: { marginBottom: 'var(--md)' },
        nested: { selector: ':last-child', style: { marginBottom: 'var(--ex-lg)' } }
      }
    },
    { selector: 'p', style: { marginBlock: 'var(--ex-lg)' } }
  ]
})
