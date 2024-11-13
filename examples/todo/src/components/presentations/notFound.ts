import { fics } from 'ficsjs'
import button from '@/components/presentations/button'
import goto from '@/utils'

interface Params {
  lang: string
  title: string
  descriptions: string[]
  buttonText: string
}

export default ({ lang, title, descriptions, buttonText }: Params) =>
  fics({
    name: 'not-found',
    data: () => ({ lang, title, descriptions, buttonText, seconds: 10 }),
    props: {
      descendant: button,
      values: ({ $getData }) => ({
        buttonText: $getData('buttonText'),
        click: () => goto($getData('lang'))
      })
    },
    html: ({
      $data: {
        title,
        descriptions: [start, end],
        seconds
      },
      $template
    }) => $template`<h2>${title}</h2><p>${start}${seconds}${end}</p>${button}`,
    css: { selector: 'p', style: { marginBottom: 'var(--ex-lg)' } },
    hooks: {
      mounted: ({ $data: { seconds }, $setData, $getData, $poll }) =>
        $poll(
          ({ $times }) => {
            if ($times === seconds - 1) goto($getData('lang'))
            $setData('seconds', seconds - $times - 1)
          },
          { interval: 1000, max: seconds }
        )
    },
    options: { lazyLoad: true }
  })
