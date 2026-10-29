import { fics, type FiCs } from 'ficsjs'
import { flex, space } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { paths } from '@/domain/path'
import { RefreshCcw } from 'lucide-static'

interface Data {
  isAccumulated: boolean
  accumulatedChunk: string
  chunks: readonly string[]
}

const SSE_FIELD = /^(event|data): ?(.*)$/gm

const props: FiCs.Props<Data, {}> = {
  descendants: ({ children: { icon } }) => icon,
  values: ({ data }) => ({
    svg: RefreshCcw,
    ariaLabel: `Switch the stream to ${data.isAccumulated ? 'a chunked' : 'an accumulated'} type`,
    isBottomFixed: true,
    click: () => (data.isAccumulated = !data.isAccumulated)
  })
}

const html: FiCs.Html<Data, {}> = ({
  children: { icon },
  data: { isAccumulated, accumulatedChunk, chunks },
  template,
  attributes: {
    a11y: { liveLog, liveStatus, srOnly }
  }
}) => template`
  <section>
    <h3>Stream</h3>
    <p key="mode" ${liveStatus} ${srOnly}>
      The current mode is ${isAccumulated ? 'accumulated' : 'chunked'}.
    </p>
    ${
      isAccumulated
        ? template`<p class="accumulated">${accumulatedChunk}</p>`
        : template`<div ${liveLog}>${chunks.map((chunk, index) => template`<p key="${index}">${chunk}</p>`)}</div>`
    }
  </section>
  ${icon}
`

const css: FiCs.Css<Data, {}> = `
  p.accumulated {
    max-width: var(--chat-width);
    line-height: 2;
    overflow-wrap: break-word;
  }

  div[role='log'] { ${flex({ direction: 'column', gap: space('md') })} }
`

let controller: AbortController | null = null
const hooks: FiCs.Hooks<Data, {}> = {
  destroyed: ({ data }) => (data.isAccumulated = false),
  updated: {
    isAccumulated: ({ data, crud }) => {
      controller?.abort()
      controller = null
      data.accumulatedChunk = ''

      if (!data.isAccumulated) return

      const { signal }: AbortController = (controller = new AbortController())
      let buffer = ''

      void crud(paths.api.STREAM, {
        signal,
        onChunk: (chunked: string) => {
          if (signal.aborted) return

          buffer += chunked

          const frames: string[] = buffer.split('\n\n')
          buffer = frames.pop() ?? ''

          for (const frame of frames) {
            const fields = Object.fromEntries(
              [...frame.matchAll(SSE_FIELD)].map(([, name, value]) => [name, value])
            )

            if (fields.event === 'complete') data.accumulatedChunk += '...'
            else if (fields.data)
              try {
                data.accumulatedChunk += JSON.parse(fields.data).chunk ?? ''
              } catch {}
          }
        }
      })
    }
  }
}

const options: FiCs.Options<Data, {}> = {
  ssr: false,
  sse: {
    path: paths.api.STREAM,
    onopen: ({ data }) => {
      data.chunks = []
    },
    onmessage: ({ data, event: { data: messageData } }) => {
      try {
        const { chunk, index } = JSON.parse(messageData) as { chunk: string; index: number }
        data.chunks = [...data.chunks, `chunk[${index}]: ${chunk}`]
      } catch {
        data.chunks = [...data.chunks, `message: ${messageData}`]
      }
    },
    actions: { complete: ({ close }) => close() }
  }
}

export default fics<Data, {}>({
  name: 'stream',
  children: [Icon()],
  data: () => ({ isAccumulated: false, accumulatedChunk: '', chunks: [] }),
  props,
  html,
  css,
  hooks,
  options
})
