import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import button from '@/components/presentations/button'
import goto from '@/utils'

interface Data {
  seconds: number
  title: string
  descriptions: string[]
  buttonText: string
}

export default fics<Data, { lang: string }>({
  name: 'not-found',
  data: () => ({ seconds: 10, title: '', descriptions: [], buttonText: '' }),
  fetch: ({ $props: { lang } }) => i18n<Data>({ directory: '/i18n', lang, key: 'notFound' }),
  props: {
    descendant: button,
    values: [
      { key: 'buttonText', content: ({ $data: { buttonText } }) => buttonText },
      {
        key: 'click',
        content:
          ({ $props: { lang } }) =>
          () =>
            goto(lang)
      }
    ]
  },
  html: ({
    $data: {
      seconds,
      title,
      descriptions: [start, end]
    },
    $template,
    $isLoaded
  }) =>
    $isLoaded
      ? $template`<h2>${title}</h2><p>${start}${seconds}${end}</p>${button}`
      : $template`<h2>Loading...</h2>`,
  css: { selector: 'p', style: { marginBottom: 'var(--ex-lg)' } },
  hooks: {
    mounted: ({ $data: { seconds }, $props: { lang }, $setData, $poll }) =>
      $poll(
        ({ $times }) => {
          if ($times === seconds - 1) goto(lang)
          $setData('seconds', seconds - $times - 1)
        },
        { interval: 1000, max: seconds }
      )
  },
  options: { ssr: false, lazyLoad: true }
})
