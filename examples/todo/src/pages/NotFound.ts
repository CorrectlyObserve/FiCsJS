import { fics, type FiCs } from 'ficsjs'
import { applyMeta, goto } from 'ficsjs/router'
import { flex, forScreenReaders, size } from 'ficsjs/style'
import Button from '@/components/Button'
import LoadState from '@/components/LoadState'
import type { Lang } from '@/domain/lang'
import { breakpoints } from '@/styles/theme'

interface Data {
  seconds: number
  heading: string
  pageTitle: FiCs.Interpolate
  countdown: (seconds: number) => string
  pause: string
  restart: string
  buttonText: string
  isCounting: boolean
}

interface Props {
  lang: Lang
}

const MAX = 20 as const

const props: FiCs.Props<Data, Props> = [
  {
    descendants: ({ children: { loadState } }) => loadState,
    values: ({ deferredStates, reloadDeferredData }) => ({
      isError: deferredStates.texts.status === 'error',
      retry: () => reloadDeferredData()
    })
  },
  { descendants: ({ children: { button } }) => button, values: () => ({ fixedUnit: 48 }) }
]

const html: FiCs.Html<Data, Props> = ({
  children: { button, loadState },
  data,
  deferredStates: {
    texts: { status }
  },
  template,
  attributes: {
    a11y: { ariaHidden, statusLiveRegion }
  }
}) => {
  if (status !== 'done') return template`<p key="status" ${statusLiveRegion}></p>${loadState}`

  const { seconds, heading, countdown, pause, restart, buttonText, isCounting } = data
  return template`
    <h2>404 ${heading}</h2>
    <p key="status" ${statusLiveRegion}>${[5, 10, MAX].includes(seconds) && countdown(seconds)}</p>
    <p ${ariaHidden}>${countdown(seconds)}</p>
    <div>
      ${button.setIndividualProps('back', {
        type: 'gradation',
        buttonText,
        click: () => goto('/', { isWithoutHistory: true })
      })}
      ${button.setIndividualProps('count', {
        buttonText: isCounting ? pause : restart,
        click: () => (data.isCounting = !data.isCounting)
      })}
    </div>
  `
}

const css: FiCs.Css<Data, Props> = `
  p {
    &[role="status"] {${forScreenReaders}}

    &[aria-hidden="true"] {
      margin-block-end: ${size(8)};
      @media (max-width: ${breakpoints.SM}) { margin-block-end: ${size(6)}; }
    }
  }

  div { ${flex({ direction: 'column', gap: size(4) })} }
`

const hooks: FiCs.Hooks<Data, Props> = {
  mounted: ({ data, poll, deferredStates }) => {
    data.seconds = MAX

    poll(
      () => {
        if (!data.isCounting || deferredStates.texts?.status !== 'done') return

        if (data.seconds <= 1) {
          data.seconds = 0
          goto('/', { isWithoutHistory: true })
          return
        }

        data.seconds--
      },
      { intervalMs: 1000, exit: () => data.seconds <= 0 }
    )
  },
  rerendered: ({ data: { pageTitle }, changedKeys }) => {
    if (changedKeys.data.includes('pageTitle'))
      applyMeta({ title: pageTitle({ page: '404 - Not Found' }) }, { merge: true })
  }
}

export default fics<Data, Props>({
  name: 'not-found',
  children: [Button(), LoadState()],
  data: () => ({ seconds: MAX, isCounting: true }),
  deferredData: {
    load: async ({ props: { lang }, i18n }) => {
      const countdown = await i18n({ lang, key: ['notFound', 'countdown'], interpolate: true })

      return {
        ...(await i18n<Omit<Data, 'countdown'>>({ lang, key: 'notFound' })),
        pageTitle: await i18n({ lang, key: ['head', 'title'], interpolate: true }),
        countdown: (seconds: number) => {
          const text = countdown({ seconds })
          return lang === 'en' && seconds === 1 ? `${text.slice(0, -2)}${text.slice(-1)}` : text
        }
      }
    },
    stateKey: 'texts',
    propsKey: 'lang',
    allowStale: true
  },
  props,
  html,
  css,
  hooks,
  options: { lazyLoad: true }
})
