import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { API_PATHS, dark } from '@/utils'
import { RefreshCcw } from 'lucide-static'

let streamSession = 0,
  streamAbortController: AbortController | null

export default fics({
  name: 'stream',
  children: [Icon()],
  data: () => ({ isAccumulated: false, accumulatedChunk: '', chunks: [] as string[] }),
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ data }) => ({
      svg: RefreshCcw,
      areaLabel: 'Open the data stream dialog',
      isLarge: true,
      click:
        ({ getData }) =>
        () =>
          (data.isAccumulated = !getData('isAccumulated'))
    })
  },
  html: ({
    children: { icon },
    data: { isAccumulated, accumulatedChunk, chunks },
    template
  }) => template`
    <h2 class="text-lg text-white text-center mb-6">Stream</h2>
    ${
      isAccumulated
        ? template`
          <p class="max-w-full text-white mx-auto whitespace-pre-wrap break-words">${accumulatedChunk}</p>
        `
        : template`
          <div class="w-fit mx-auto">
            ${chunks.map((chunk, index) => template`<p class="text-white mb-4" key="${index}">${chunk}</p>`)}
          </div>
        `
    }
    <span class="fixed bottom-8 right-4">${icon}</span>
  `,
  css: {
    ':host': {
      '> p': { width: cssVar('chat-width'), lineHeight: 2 },
      'div p:last-child': { 'margin-bottom': '0' },
      span: { background: dark() }
    }
  },
  hooks: {
    updated: {
      isAccumulated: ({ data, crud }) => {
        const { isAccumulated, accumulatedChunk } = data

        if (isAccumulated) {
          if (streamAbortController) streamAbortController.abort()
          streamAbortController = new AbortController()

          let buffer = ''
          const currentSession = ++streamSession

          void crud(API_PATHS.stream, {
            onChunk: (chunked: string) => {
              if (streamSession !== currentSession) return

              buffer += chunked

              const blocks = buffer.split('\n\n')
              buffer = blocks.pop() || ''

              for (const block of blocks) {
                if (block.trim() === '') continue

                let event: string | undefined, chunkData: string | undefined

                for (const line of block.split('\n'))
                  if (line.startsWith('event:')) {
                    const index = line.indexOf('data:')
                    event = line.slice('event:'.length, index > -1 ? index : undefined).trim()
                  } else if (line.startsWith('data:')) chunkData = line.slice('data:'.length).trim()

                if (chunkData) {
                  const { chunk } = JSON.parse(chunkData) as { chunk?: string }
                  if (chunk) data.accumulatedChunk = `${accumulatedChunk}${chunk}`
                }

                if (event === 'complete') data.accumulatedChunk = `${accumulatedChunk}...`
              }
            }
          })
        } else {
          data.accumulatedChunk = ''
          streamSession++
        }
      }
    }
  },
  options: {
    ssr: false,
    sse: {
      path: API_PATHS.stream,
      onmessage: ({ data, event: { data: messageData } }) => {
        try {
          const { chunk, index } = JSON.parse(messageData) as { chunk: string; index: number }
          data.chunks = [...data.chunks, `chunk[${index}]: ${chunk}`]
        } catch {
          data.chunks = [...data.chunks, `message: ${data}`]
        }
      },
      actions: { complete: ({ close }) => close() }
    }
  }
})
