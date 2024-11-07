import { ficsAwait } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import button from '@/components/presentations/button'
import goto from '@/utils'

interface Response {
  title: string
  description: string
  buttonText: string
}

export default ficsAwait<{ seconds: number }, { lang: string }, Response>({
  data: () => ({ seconds: 5 }),
  fetch: ({ $getData, $props: { lang } }) =>
    i18n({
      directory: '/i18n',
      lang,
      key: ['notFound'],
      variables: { seconds: $getData('seconds') }
    }),
  awaited: ({ $data: { seconds }, $template, $response: { title, description } }) =>
    $template`<h2>${title}</h2><p>${description}</p><p>${seconds}</p>${button}`,
  props: {
    descendant: button,
    values: ({ $props: { lang } }) => ({ click: () => goto(lang) })
  },
  css: { selector: 'p', style: { marginBottom: 'var(--ex-lg)' } },
  hooks: {
    mounted: ({ $data: { seconds }, $props: { lang }, $setData, $poll }) =>
      $poll(
        ({ $times }) => {
          $setData('seconds', seconds - $times - 1)
          if ($times === 4) goto(lang)
        },
        { interval: 1000, max: 5 }
      )
  },
  options: { ssr: false }
})
