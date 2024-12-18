import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import langs from '@/components/multitons/containers/langs'

export default fics({
  name: 'header',
  data: () => ({ lang: '', pathname: '', heading: '' }),
  fetch: async ({ $data: { lang } }) => ({
    heading: await i18n<string>({ directory: '/i18n', lang, key: 'heading' })
  }),
  props: {
    descendant: langs,
    values: [
      { key: 'lang', content: ({ $data: { lang } }) => lang },
      { key: 'pathname', content: ({ $data: { pathname } }) => pathname }
    ]
  },
  html: ({ $data: { heading }, $template }) =>
    $template`<header><h1>${heading}</h1><div>${langs}</div></header>`,
  css: [
    { style: { display: 'block' } },
    {
      selector: 'header',
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBlock: 'var(--md)'
      },
      nested: [
        {
          selector: '> h1',
          style: {
            background: 'var(--gradation)',
            backgroundClip: 'text',
            webkitTextFillColor: 'transparent'
          }
        },
        {
          selector: '> div',
          style: {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: 'var(--ex-sm)'
          }
        }
      ]
    }
  ]
})
